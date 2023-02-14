package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/go-chi/chi/v5"
	"github.com/mailgun/groupcache/v2"
	"github.com/meerkat-dashboard/meerkat"
	"github.com/meerkat-dashboard/meerkat/ui"
)

var config Config

func main() {
	configFile := flag.String("config", "", "load configuration from this file")
	vflag := flag.Bool("v", false, "build version information")
	fflag := flag.String("ui", "", "user interface directory")
	flag.Parse()

	if *vflag {
		fmt.Fprintln(os.Stderr, meerkat.BuildString())
		return
	}

	var err error
	config, err = LoadConfig(*configFile)
	if err != nil {
		log.Fatalln(err)
	}
	icingaURL, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Fatalln("parse icinga url:", err)
	}

	initialiseIcingaCaches()

	if err := os.MkdirAll("dashboards", 0755); err != nil {
		log.Fatalln("Error creating dashboards directory:", err)
	}

	cachepool := groupcache.NewHTTPPool("http://localhost:8585")
	cachepool.Set("http://localhost:8585")

	r := chi.NewRouter()

	r.Handle("/_groupcache/", cachepool)

	r.Get("/dashboard/{slug}", handleListDashboard)

	r.Post("/dashboard", handleCreateDashboard)
	r.Post("/dashboard/{slug}", handleUpdateDashboard)
	r.Delete("/dashboard/{slug}", handleDeleteDashboard)

	r.Get("/icinga/{check-type}", handleIcingaCheck)
	r.Get("/icinga/{check-type}/{object-id}", handleIcingaCheck)
	r.Get("/icinga/check_state", handleIcingaCheckState)
	r.Get("/icinga/check_result", handleCheckResult)

	// Serve the Icinga API, stripping the leading "/icinga" prefix from the Meerkat UI.
	proxy := http.StripPrefix("/icinga", NewIcingaProxy(icingaURL, config.IcingaUsername, config.IcingaPassword, config.IcingaInsecureTLS))
	r.Handle("/icinga/v1/*", proxy)

	// Previous versions of meerkat served user-uploaded files from this directory.
	// Keep serving them for backwards compatibility.
	_, err = os.Stat("./dashboards-data")
	if err == nil {
		r.Handle("/dashboards-data/*", http.StripPrefix("/dashboards-data/", http.FileServer(http.Dir("./dashboards-data"))))
	}

	srv := ui.NewServer(nil)
	if *fflag != "" {
		srv = ui.NewServer(os.DirFS(path.Clean(*fflag)))
	}
	r.Get("/{slug}/view", srv.ViewHandler)
	r.Get("/{slug}/edit", srv.EditHandler)
	r.Get("/{slug}/info", srv.InfoPage)
	r.Post("/{slug}/info", srv.EditInfoHandler)
	r.Get("/view/*", oldPathHandler)
	r.Get("/edit/*", oldPathHandler)
	r.Get("/{slug}/delete", srv.DeletePage)
	r.Post("/{slug}/delete", handleDeleteDashboard)
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
