package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/meerkat-dashboard/meerkat"
)

func handleListDashboards(w http.ResponseWriter, r *http.Request) {
	dashboards, err := meerkat.ReadDashboardDir("dashboards")
	if err != nil {
		msg := fmt.Sprintf("read dashboard directory: %v", err)
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
	}
	json.NewEncoder(w).Encode(dashboards)
}

func handleListDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Check dashboard exists
	if f, err := os.Open(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Println("Error checking that file exists:", err)
		http.Error(w, "Error checking file exists: "+err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.Header().Add("content-type", "application/json")
		defer f.Close()
		_, err = io.Copy(w, f)
		if err != nil {
			log.Println("Error writing response:", err)
			http.Error(w, "Error writing response: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func handleCreateDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	switch title := req.PostForm.Get("title"); title {
	case "":
		http.Error(w, "empty name", http.StatusBadRequest)
		return
	case "edit", "view":
		http.Error(w, "reserved title for old Meerkat URL paths", http.StatusBadRequest)
		return
	}

	var dashboard meerkat.Dashboard
	for k := range req.PostForm {
		switch v := req.PostForm.Get(k); k {
		case "title":
			dashboard.Title = v
			dashboard.Slug = meerkat.TitleToSlug(dashboard.Title)
		default:
			http.Error(w, fmt.Sprintf("unknown parameter %s", k), http.StatusBadRequest)
			return
		}
	}
	fpath := path.Join("dashboards", dashboard.Slug+".json")
	if err := meerkat.CreateDashboard(fpath, &dashboard); err != nil {
		msg := fmt.Sprintf("create dashboard %s: %v", dashboard.Slug, err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	new := path.Join("/", dashboard.Slug, "edit")
	next := http.RedirectHandler(new, http.StatusFound)
	next.ServeHTTP(w, req)
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

func trimFirstRune(s string) string {
	_, i := utf8.DecodeRuneInString(s)
	return s[i:]
}

func handleUpdateDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Check dashboard exists
	if _, err := os.Stat(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	var dashboard meerkat.Dashboard
	if err := json.NewDecoder(r.Body).Decode(&dashboard); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	//Set dimension of background
	width, height, err := imageDimension(trimFirstRune(dashboard.Background))
	if err != nil {
		dashboard.Background = ""
	}
	dashboard.Height = strconv.Itoa(height)
	dashboard.Width = strconv.Itoa(width)

	slugNew := meerkat.TitleToSlug(dashboard.Title)
	if len(slug) < 1 {
		http.Error(w, "empty slug from dashboard title", http.StatusBadRequest)
		return
	}

	err = meerkat.CreateDashboard(path.Join("dashboards", slugNew+".json"), &dashboard)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete old file if slug updated
	if slug != slugNew {
		fmt.Printf("Slug updated %s -> %s deleting old data\n", slug, slugNew)
		err := os.Remove(path.Join("dashboards", slug+".json"))
		if err != nil {
			log.Println("Failed to remove old file:", err)
			http.Error(w, "Failed to remove old file: "+err.Error(), http.StatusInternalServerError)
			return
		}
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

func imageDimension(imagePath string) (int, int, error) {
	file, err := os.Open(imagePath)
	if err != nil {
		log.Println(err)
		return 0, 0, err
	}

	image, _, err := image.DecodeConfig(file)
	if err != nil {
		log.Println(imagePath, err)
		return 0, 0, err
	}
	return image.Width, image.Height, nil
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
	fmt.Println(new)
	return new
}
