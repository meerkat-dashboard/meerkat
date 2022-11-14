package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"

	"github.com/go-chi/chi/v5"
	"github.com/mailgun/groupcache/v2"
	"github.com/meerkat-dashboard/meerkat"
	"github.com/meerkat-dashboard/meerkat/ui"
)

func init() {
	log.SetFlags(log.LstdFlags | log.Llongfile)
}

func mkDirs() error {
	if err := os.MkdirAll("dashboards", 0755); err != nil {
		return err
	}
	return os.MkdirAll("dashboards-data", 0755)
}

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

	initialiseIcingaCaches()

	if err := mkDirs(); err != nil {
		log.Fatalln("Error creating dashboards directory:", err)
	}

	cachepool := groupcache.NewHTTPPool("http://localhost:8585")
	cachepool.Set("http://localhost:8585")

	r := chi.NewRouter()

	r.Handle("/_groupcache/", cachepool)

	r.Get("/dashboard", handleListDashboards)
	r.Get("/dashboard/{slug}", handleListDashboard)

	var (
		createDashboard http.HandlerFunc
		updateDashboard http.HandlerFunc
		deleteDashboard http.HandlerFunc
	)
	if config.AdminUsername != "" && config.AdminPassword != "" {
		user, pass := config.AdminUsername, config.AdminPassword
		store := newTokenStore()
		createDashboard = basicAuthHandler(user, pass, store, http.HandlerFunc(handleCreateDashboard)).ServeHTTP
		updateDashboard = basicAuthHandler(user, pass, store, http.HandlerFunc(handleUpdateDashboard)).ServeHTTP
		deleteDashboard = basicAuthHandler(user, pass, store, http.HandlerFunc(handleDeleteDashboard)).ServeHTTP

		rdr := http.RedirectHandler("/", http.StatusFound)
		r.Get("/authenticate", basicAuthHandler(user, pass, store, rdr).ServeHTTP)
		// a hint for the frontend to see if authentication is configured.
		r.Head("/authentication", emptyHandler)
	} else {
		createDashboard = handleCreateDashboard
		updateDashboard = handleUpdateDashboard
		deleteDashboard = handleDeleteDashboard
	}
	r.Post("/dashboard", createDashboard)
	r.Post("/dashboard/{slug}", updateDashboard)
	r.Delete("/dashboard/{slug}", deleteDashboard)

	// relay to icinga server
	// browser <-> meerkat <-> icinga
	r.Get("/icinga/{check-type}", handleIcingaCheck)
	r.Get("/icinga/dynamic_text/{host-name}", handleIcingaVars)
	r.Get("/icinga/{check-type}/{object-id}", handleIcingaCheck)
	r.Get("/icinga/check_state", handleIcingaCheckState)
	r.Get("/icinga/check_result", handleCheckResult)

	// persist user uploaded files onto server's local filesystem
	r.Post("/upload", handleUpload)

	// serve static assets, referenced in dashboard json configurations
	r.Handle("/dashboards-data/*", http.StripPrefix("/dashboards-data/", http.FileServer(http.Dir("./dashboards-data"))))

	srv := ui.NewServer(nil)
	if *fflag != "" {
		srv = ui.NewServer(os.DirFS(path.Clean(*fflag)))
	}
	r.Get("/{slug}/view", srv.ViewHandler)
	r.Get("/{slug}/edit", srv.EditHandler)
	r.Get("/view/*", oldPathHandler)
	r.Get("/edit/*", oldPathHandler)
	r.Get("/{slug}/delete", srv.DeletePage)
	r.Post("/{slug}/delete", handleDeleteDashboard)
	r.Get("/create", srv.CreatePage)
	r.Post("/create", createDashboard)
	r.Get("/clone", srv.ClonePage)
	r.Post("/clone", handleCloneDashboard)
	r.Get("/about", srv.AboutPage)
	r.Get("/*", srv.FileServer().ServeHTTP)
	r.Get("/", srv.RootHandler)

	log.Println("Starting web server on", config.HTTPAddr)
	log.Fatal(http.ListenAndServe(config.HTTPAddr, r))
}
