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
	r.Post("/file/background", srv.UploadFileHandler("./dashboards-background", "image/"))
	r.Get("/view/*", oldPathHandler)
	r.Get("/edit/*", oldPathHandler)
	r.Get("/create", srv.CreatePage)
	r.Post("/create", handleCreateDashboard)
	r.Get("/clone", srv.ClonePage)
	r.Post("/clone", handleCloneDashboard)
	r.Get("/about", srv.AboutPage)
	r.Get("/*", srv.FileServer().ServeHTTP)
	r.Get("/", srv.RootHandler)

	log.Println("Starting web server on", config.HTTPAddr)
	log.Fatal(http.ListenAndServe(config.HTTPAddr, r))
}
