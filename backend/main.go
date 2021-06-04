package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
)

func initDirs() error {
	requiredDirs := []string{"dashboards", "dashboards-data"}

	files, err := ioutil.ReadDir("./")
	if err != nil {
		return fmt.Errorf("Failed to read directory - %s", err)
	}

	//Check directories exist, if not create
Files:
	for _, p := range requiredDirs {
		for _, f := range files {
			if f.Name() == p {
				continue Files
			}
		}

		fmt.Printf("%s directory not found, creating\n", p)
		err = os.Mkdir(p, os.ModePerm)
		if err != nil {
			return err
		}
	}

	return nil
}

//Config - application config data
type Config struct {
	HTTPAddr string

	IcingaURL         string
	IcingaUsername    string
	IcingaPassword    string
	IcingaInsecureTLS bool
}

var config Config

func main() {
	var configFile string
	flag.StringVar(&configFile, "config", "./meerkat.toml", "provide an alternative config path")
	flag.Parse()

	//Config
	fmt.Printf("Reading config: %s\n", configFile)
	_, err := toml.DecodeFile(configFile, &config)
	if err != nil {
		log.Fatalf("Error reading config - %s\n", err)
	}

	//Initialize directories
	err = initDirs()
	if err != nil {
		log.Fatalf("Error initializing dashboards directory - %s\n", err)
	}

	//Web server setup
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Get("/dashboard", handleListDashboards)
	r.Get("/dashboard/{slug}", handleListDashboard)
	r.Post("/dashboard", handleCreateDashboard)

	r.Post("/settings", handleChangeSettings)
	r.Get("/settings", handleGetSettings)

	r.Post("/dashboard/{slug}", handleUpdateDashboard)
	r.Delete("/dashboard/{slug}", handleDeleteDashboard)

	r.Get("/icinga/{check-type}", handleIcingaCheck)
	r.Get("/icinga/one_host/{host-name}", handleIcingaVars)
	r.Get("/icinga/{check-type}/{object-id}", handleIcingaCheck)

	r.Get("/icinga/check_state", handleIcingaCheckState)
	r.Get("/icinga/check_result", handleCheckResult)

	r.Get("/template", handleCreateTemplate)

	r.Post("/upload", handleUpload)
	r.Handle("/dashboards-data/*", http.StripPrefix("/dashboards-data/", http.FileServer(http.Dir("./dashboards-data"))))

	r.NotFound(createFileHandler("./frontend"))

	fmt.Printf("Starting web server: %s\n", config.HTTPAddr)
	log.Fatal(http.ListenAndServe(config.HTTPAddr, r))
}

//Serves index.html if the path isn't found
func createFileHandler(frontendPath string) func(w http.ResponseWriter, r *http.Request) {
	frontendDir := http.Dir(frontendPath)
	fs := http.FileServer(frontendDir)

	return func(w http.ResponseWriter, r *http.Request) {
		p := path.Clean(r.URL.Path)
		f, err := frontendDir.Open(p)

		if errors.Is(err, os.ErrNotExist) {
			f, err := os.Open(path.Join(frontendPath, "index.html"))
			if err != nil {
				http.Error(w, "Error opening index.html - "+err.Error(), http.StatusInternalServerError)
			}
			_, err = io.Copy(w, f)
			if err != nil {
				http.Error(w, "Error writing index.html to response - "+err.Error(), http.StatusInternalServerError)
			}
			f.Close()
		} else {
			f.Close()
			fs.ServeHTTP(w, r)
		}
	}
}
