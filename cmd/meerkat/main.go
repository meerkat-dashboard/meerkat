package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"sync"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"
	"github.com/meerkat-dashboard/meerkat"
	"github.com/meerkat-dashboard/meerkat/ui"
	"github.com/r3labs/sse/v2"
)

var config Config
var server *sse.Server
var icingaLog log.Logger
var status Status
var requestList []Requests
var dashboardCache map[string][]ElementStore
var mapLock = &sync.RWMutex{}
var cache *ristretto.Cache

type ElementStore struct {
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	LastEvent string   `json:"last_event"`
	Objects   []string `json:"objects"`
}

var eventList EventList

func updateDashboardCache(slug string) {
	mapLock.Lock()
	defer mapLock.Unlock()
	dashboard, err := meerkat.ReadDashboard(path.Join("dashboards", slug+".json"))

	dash, ok := dashboardSync.Load(slug)
	if ok {
		d := dash.(Dashboard)
		d.Folder = dashboard.Folder
		d.Title = dashboard.Title
		d.Order = dashboard.Order
		dashboardSync.Store(slug, d)
	}

	if err != nil {
		log.Println("Error reading dashboard:", err)
		return
	}
	server.CreateStream(dashboard.Slug)
	dashboardCache[dashboard.Slug] = nil
	for _, element := range dashboard.Elements {
		if len(element.Options.ObjectName) != 0 {
			dashboardCache[dashboard.Slug] = append(dashboardCache[dashboard.Slug], ElementStore{Name: element.Options.ObjectName, Type: element.Options.ObjectType})
		}
	}
}

func createDashboardCache() {
	mapLock.Lock()
	defer mapLock.Unlock()
	dashboardSync.Range(func(key interface{}, value interface{}) bool {
		dashboardSync.Delete(key)
		return true
	})
	dashboards, err := meerkat.ReadDashboardDir("dashboards")
	if err != nil {
		log.Println("Error reading dashboards:", err)
		return
	}
	cache.Clear()
	dashboardCache = make(map[string][]ElementStore)
	for _, dashboard := range dashboards {
		dashboardSync.Store(dashboard.Slug, Dashboard{
			Title:           dashboard.Title,
			Slug:            dashboard.Slug,
			Folder:          dashboard.Folder,
			CurrentlyOpenBy: []string{},
			Order:           dashboard.Order,
		})
		server.CreateStream(dashboard.Slug)

		for _, element := range dashboard.Elements {
			if len(element.Options.ObjectName) != 0 {
				dashboardCache[dashboard.Slug] = append(dashboardCache[dashboard.Slug], ElementStore{Name: element.Options.ObjectName, Type: element.Options.ObjectType})
			}
		}
	}
}

func main() {
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	configFile := flag.String("config", defaultConfigPath, "load configuration from this file")
	vflag := flag.Bool("v", false, "build version information")
	fflag := flag.String("ui", "", "user interface directory")
	flag.Parse()

	if *vflag {
		log.Println(meerkat.BuildString())
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

	if err := os.MkdirAll(config.LogDirectory, 0755); err != nil {
		log.Fatalln("Error creating log directory:", err)
	}

	if config.LogFile {
		f, err := os.OpenFile(config.LogDirectory+"meerkat.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening file: %v", err)
		}
		defer f.Close()
		if config.LogConsole {
			multi := io.MultiWriter(f, os.Stdout)
			log.SetOutput(multi)
		} else {
			log.SetOutput(f)
		}
	}

	if config.IcingaDebug {
		f, err := os.OpenFile(config.LogDirectory+"icinga_api.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening file: %v", err)
		}
		defer f.Close()
		switch {
		case config.LogConsole && config.LogFile:
			multi := io.MultiWriter(f, os.Stdout)
			icingaLog = *log.New(multi, "", log.Ldate|log.Ltime)
		case config.LogConsole:
			icingaLog = *log.New(os.Stdout, "", log.Ldate|log.Ltime)
		case config.LogFile:
			icingaLog = *log.New(f, "", log.Ldate|log.Ltime)
		}
	}

	r := chi.NewRouter()
	r.Get("/dashboard/{slug}", handleListDashboard)
	r.Post("/dashboard", handleCreateDashboard)
	r.Post("/dashboard/{slug}", handleUpdateDashboard)
	r.Delete("/dashboard/{slug}", handleDeleteDashboard)

	// Serve the Icinga API
	if icingaURL.Host != "" {

		server = sse.New()
		server.AutoReplay = false
		server.AutoStream = false
		server.CreateStream("updates")

		eventList = EventList{}
		go func() {
			for range time.Tick(time.Second) {
				eventList.Lock()
				oneMinuteAgo := time.Now().Add(-1 * time.Minute)
				for i := len(eventList.events) - 1; i >= 0; i-- {
					event := eventList.events[i]
					if time.UnixMilli(event.ReceivedTime).Before(oneMinuteAgo) {
						eventList.events = append(eventList.events[:i], eventList.events[i+1:]...)
					}
				}
				eventList.Unlock()
			}
		}()

		go func() {
			for {
				EventListener()
				log.Println("Disconnected from event stream waiting 10 seconds")
				time.Sleep(time.Second * 10)
			}
		}()

		cache, err = ristretto.NewCache(&ristretto.Config{
			NumCounters: 1e7,     // number of keys to track frequency of (10M).
			MaxCost:     1 << 30, // maximum cost of cache (1GB).
			BufferItems: 64,      // number of keys per Get buffer.
		})
		if err != nil {
			panic(err)
		}

		createDashboardCache()
		createEventStream(r)
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

	r.Get("/api/all", getAllHandler)
	r.Get("/api/objects", getObjectHandler)
	r.Get("/api/status", getStatusHandler)
	r.Get("/api/cache/*", getCacheDashboardHandler)
	r.Get("/api/cache", getCacheHandler)
	r.Delete("/api/cache", clearCacheHandler)

	r.Get("/{slug}/update", UpdateHandler)

	r.Post("/file/background", srv.UploadFileHandler("./dashboards-background", "image/"))
	r.Delete("/file/background", srv.DeleteFileHandler("./dashboards-background"))
	r.Post("/file/sound", srv.UploadFileHandler("./dashboards-sound", "audio/"))
	r.Delete("/file/sound", srv.DeleteFileHandler("./dashboards-sound"))
	r.Get("/file/sound", srv.GetSounds)

	r.Get("/cache", srv.CachePage)
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
			currentCheck := checkProgramStart()
			if currentCheck != 0 {
				SetWorking()
			} else {
				log.Println("Icinga error current check is 0")
				SendError()
			}
			if previousCheck != currentCheck && previousCheck != 0 && currentCheck != 0 {
				log.Printf("Icinga reloaded prev: %v curr: %v\n", previousCheck, currentCheck)
				createDashboardCache()
				UpdateAll()
			}
			previousCheck = currentCheck
			time.Sleep(30 * time.Second)
		}
	}()

	go func() {
		for {
			SendHeartbeat()
			time.Sleep(5 * time.Second)
		}
	}()

	status.Meerkat.StartTime = time.Now().UnixMilli()
	status.Backends.Icinga.Type = "icinga"

	if config.SSLEnable {
		log.Printf("Starting https web server on https://%s\n", config.HTTPAddr)
		if !config.LogConsole {
			fmt.Printf("Starting https web server on https://%s\n", config.HTTPAddr)
		}
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
		if !config.LogConsole {
			fmt.Printf("Starting http web server on http://%s\n", config.HTTPAddr)
		}
		log.Fatal(http.ListenAndServe(config.HTTPAddr, r))
	}
}
