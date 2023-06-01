package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/meerkat-dashboard/meerkat"
)

type UpdateChannel struct {
	Clients  []chan string
	Notifier chan string
}

var updateChannel = UpdateChannel{
	Clients:  make([]chan string, 0),
	Notifier: make(chan string),
}

func sendUpdates(done <-chan interface{}) {
	for {
		select {
		case <-done:
			return
		case data := <-updateChannel.Notifier:
			for _, channel := range updateChannel.Clients {
				channel <- data
			}
		}
	}
}

func UpdateHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	name := strings.Split(path.Dir(req.URL.Path), "/")[1]
	updateChannel.Notifier <- name
}

func UpdateEvents() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		updateChan := make(chan string)
		updateChannel.Clients = append(updateChannel.Clients, updateChan)

		done := make(chan interface{})
		defer close(done)

		for {
			select {
			case <-done:
				close(updateChan)
				return
			case data := <-updateChan:
				fmt.Fprintf(w, "data: %v\n\n", data)
				if wf, ok := w.(http.Flusher); ok {
					wf.Flush()
				}
			case data := <-updateChannel.Notifier:
				for _, channel := range updateChannel.Clients {
					channel <- data
				}
			}
		}
	}
}

func handleListDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	http.ServeFile(w, r, path.Join("dashboards", slug+".json"))
}

func handleCreateDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	dashboard, err := meerkat.ParseDashboardForm(req.PostForm)
	if err != nil {
		msg := fmt.Sprintf("parse dashboard from form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	fpath := path.Join("dashboards", dashboard.Slug+".json")
	if err := meerkat.CreateDashboard(fpath, &dashboard); err != nil {
		msg := fmt.Sprintf("create dashboard %s: %v", dashboard.Slug, err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	u := path.Join("/", dashboard.Slug, "edit")
	http.Redirect(w, req, u, http.StatusFound)
}

func handleCloneDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	if req.PostForm.Get("title") == "" {
		http.Error(w, "empty title", http.StatusBadRequest)
		return
	} else if req.PostForm.Get("src") == "" {
		http.Error(w, "missing source dashboard slug", http.StatusBadRequest)
		return
	}

	srcPath := path.Join("dashboards", req.PostForm.Get("src")+".json")
	src, err := meerkat.ReadDashboard(srcPath)
	if err != nil {
		msg := fmt.Sprintf("read source dashboard from %s: %v", srcPath, err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	dest := src
	dest.Title = req.PostForm.Get("title")
	destPath := path.Join("dashboards", dest.Slug+".json")
	if err := meerkat.CreateDashboard(destPath, &dest); err != nil {
		msg := fmt.Sprintf("create dashboard from %s: %v", srcPath, err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	new := path.Join("/", dest.Slug, "edit")
	next := http.RedirectHandler(new, http.StatusFound)
	next.ServeHTTP(w, req)
}

func handleUpdateDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	_, err := meerkat.ReadDashboard(path.Join("dashboards", slug+".json"))
	if errors.Is(err, fs.ErrNotExist) {
		http.NotFound(w, r)
		return
	}

	var dashboard meerkat.Dashboard
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&dashboard); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if dashboard.Background != "" {
		width, height, err := imageDimensions(dashboard.Background)
		if err != nil {
			msg := fmt.Sprintf("read background image %s dimensions: %v", dashboard.Background, err)
			log.Println(msg)
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
		dashboard.Height = strconv.Itoa(height)
		dashboard.Width = strconv.Itoa(width)
	}

	err = meerkat.CreateDashboard(path.Join("dashboards", slug+".json"), &dashboard)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func handleDeleteDashboard(w http.ResponseWriter, req *http.Request) {
	slug, _ := path.Split(req.URL.Path)
	slug = path.Clean(slug)
	fname := path.Join("dashboards", slug+".json")
	err := os.Remove(fname)
	if errors.Is(err, fs.ErrNotExist) {
		http.Error(w, "no such dashboard "+fname, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "remove dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}
	http.RedirectHandler("/", http.StatusFound).ServeHTTP(w, req)
}

func imageDimensions(ref string) (width, height int, err error) {
	if strings.HasPrefix(ref, "/dashboards-data") {
		// trim leading "/", files on disk are at "dashboards-data/example.png"
		return imageDimensionsFile(strings.TrimPrefix(ref, "/"))
	}
	return imageDimensionsURL(ref)
}

func imageDimensionsFile(name string) (int, int, error) {
	f, err := os.Open(name)
	if err != nil {
		return 0, 0, err
	}
	defer f.Close()
	return readImageDimensions(f)
}

func imageDimensionsURL(url string) (int, int, error) {
	resp, err := http.Get(url)
	if err != nil {
		return 0, 0, err
	}
	if resp.StatusCode >= 400 {
		return 0, 0, fmt.Errorf("get %s: response status code %s", url, resp.Status)
	}
	defer resp.Body.Close()
	return readImageDimensions(resp.Body)
}

func readImageDimensions(r io.Reader) (width, height int, err error) {
	img, format, err := image.DecodeConfig(r)
	if err != nil {
		err = fmt.Errorf("decode as %s: %v", format, err)
	}
	return img.Width, img.Height, err
}

func oldPathHandler(w http.ResponseWriter, req *http.Request) {
	// handle redirect loops
	if path.Base(req.URL.Path) == "view" || path.Base(req.URL.Path) == "edit" {
		http.Error(w, "reserved dashboard name for old Meerkat URLs", http.StatusBadRequest)
		return
	}
	new := swapPath(req.URL.Path)
	http.RedirectHandler(new, http.StatusMovedPermanently).ServeHTTP(w, req)
}

// swapPath takes a file path to a dashboard from a previous Meerkat
// release and returns a path in the newer format.
// For example given the old path "/view/my-network", the new path is "/my-network/view".
func swapPath(old string) string {
	new := path.Join("/", path.Base(old), path.Dir(old))
	return new
}
