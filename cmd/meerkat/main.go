package main

import (
	"crypto/tls"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/meerkat-dashboard/icinga-go"
	"github.com/meerkat-dashboard/meerkat"
	"github.com/meerkat-dashboard/meerkat/ui"
)

var config Config

func main() {
	configFile := flag.String("config", defaultConfigPath, "load configuration from this file")
	vflag := flag.Bool("v", false, "build version information")
	fflag := flag.String("ui", "", "user interface directory")
	flag.Parse()

	if *vflag {
		fmt.Fprintln(os.Stderr, meerkat.BuildString())
		return
	}

	var err error
	config, err = LoadConfig(*configFile)
	if errors.Is(err, fs.ErrNotExist) && *configFile == defaultConfigPath {
		// We tried to opportunistically load the default
		// config file but it's not there. No problem.
	} else if err != nil {
		log.Fatalln("load config:", err)
	}
	icingaURL, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Fatalln("parse icinga url:", err)
	}

	// Make directories for dashboards and related assets
	if err := os.MkdirAll("dashboards", 0755); err != nil {
		log.Fatalln("Error creating dashboards directory:", err)
	}

	if err := os.MkdirAll("dashboards-background", 0755); err != nil {
		log.Fatalln("Error creating dashboards background directory:", err)
	}

	if err := os.MkdirAll("dashboards-sound", 0755); err != nil {
		log.Fatalln("Error creating dashboards sound directory:", err)
	}

	r := chi.NewRouter()
	r.Get("/dashboard/{slug}", handleListDashboard)
	r.Post("/dashboard", handleCreateDashboard)
	r.Post("/dashboard/{slug}", handleUpdateDashboard)
	r.Delete("/dashboard/{slug}", handleDeleteDashboard)

	// Serve the Icinga API
	if icingaURL.Host != "" {
		hc := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: config.IcingaInsecureTLS},
			},
		}
		client, err := icinga.Dial(icingaURL.Host, config.IcingaUsername, config.IcingaPassword, hc)
		if err != nil {
			log.Println("dial icinga:", err)
		}
		rproxy := NewIcingaProxy(icingaURL, config.IcingaUsername, config.IcingaPassword, config.IcingaInsecureTLS)
		// Let the server cache responses from icinga to ease load on request bursts.
		cache := NewCachingProxy(rproxy, 10*time.Second)
		r.Handle("/icinga/v1/*", http.StripPrefix("/icinga", cache))

		// Subscribe to object state changes. Some dashboard elements
		// read events instead of polling.
		stream := meerkat.NewEventStream(client)
		events := []string{"CheckResult", "StateChange"}
		go func() {
			for {
				if err := stream.Subscribe(events); err != nil {
					log.Println("subscribe to icinga event stream:", err)
					dur := 10 * time.Second
					log.Printf("retrying in %s", dur)
					time.Sleep(dur)
					continue
				}
			}
		}()

		r.Handle("/icinga/stream", stream)
	}

	// Previous versions of meerkat served user-uploaded files from this directory.
	// Keep serving them for backwards compatibility.
	_, err = os.Stat("./dashboards-background")
	if err == nil {
		r.Handle("/dashboards-background/*", http.StripPrefix("/dashboards-background/", http.FileServer(http.Dir("./dashboards-background"))))
	}

	_, err = os.Stat("./dashboards-sound")
	if err == nil {
		r.Handle("/dashboards-sound/*", http.StripPrefix("/dashboards-sound/", http.FileServer(http.Dir("./dashboards-sound"))))
	}

	srv := ui.NewServer(nil)
	if *fflag != "" {
		srv = ui.NewServer(os.DirFS(path.Clean(*fflag)))
	}
	r.Get("/{slug}/view", srv.ViewHandler)
	r.Get("/{slug}/edit", srv.EditHandler)
	r.Get("/{slug}/delete", srv.DeletePage)
	r.Post("/{slug}/delete", handleDeleteDashboard)
	r.Get("/{slug}/info", srv.InfoPage)
	r.Post("/{slug}/info", srv.EditInfoHandler)

	done := make(chan interface{})
	defer close(done)
	go sendUpdates(done)

	r.Get("/{slug}/update", UpdateHandler)
	r.HandleFunc("/dashboard/stream", UpdateEvents())
	r.Post("/file/background", srv.UploadFileHandler("./dashboards-background", "image/"))
	r.Post("/file/sound", srv.UploadFileHandler("./dashboards-sound", "audio/"))

	r.Get("/view/*", oldPathHandler)
	r.Get("/edit/*", oldPathHandler)
	r.Get("/create", srv.CreatePage)
	r.Post("/create", handleCreateDashboard)
	r.Get("/clone", srv.ClonePage)
	r.Post("/clone", handleCloneDashboard)
	r.Get("/about", srv.AboutPage)
	r.Get("/assets/backgrounds", srv.BackgroundPage)
	r.Get("/assets/sounds", srv.SoundPage)
	r.Get("/*", srv.FileServer().ServeHTTP)
	r.Get("/", srv.RootHandler)

	go func() {
		var previousCheck float64
		for {
			currentCheck := checkProgramStart(config.IcingaUsername, config.IcingaPassword, config.IcingaInsecureTLS)
			if previousCheck != currentCheck && previousCheck != 0 {
				UpdateAll()
			}
			previousCheck = currentCheck
			time.Sleep(60 * time.Second)
		}
	}()

	if config.SSLEnable {
		log.Printf("Starting https web server on https://%s\n", config.HTTPAddr)
		_, err := os.Stat(config.SSLCert)
		if os.IsNotExist(err) {
			log.Fatalf("Invalid SSLCert Path %s does not exist\n", config.SSLCert)
		}
		_, err = os.Stat(config.SSLKey)
		if os.IsNotExist(err) {
			log.Fatalf("Invalid SSLKey Path %s does not exist\n", config.SSLKey)
		}
		log.Fatal(http.ListenAndServeTLS(config.HTTPAddr, config.SSLCert, config.SSLKey, r))
	} else {
		log.Printf("Starting http web server on http://%s\n", config.HTTPAddr)
		log.Fatal(http.ListenAndServe(config.HTTPAddr, r))
	}
}
