package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi"
)

//Dashboard contains all information to render a dashboard
type Dashboard struct {
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Background string    `json:"background"`
	Width      string    `json:"width"`
	Height     string    `json:"height"`
	Tags       []string  `json:"tags"`
	Elements   []Element `json:"elements"`
}

//Element contains any service/host information needed
type Element struct {
	Type     string                 `json:"type"`
	Title    string                 `json:"title"`
	Rect     Rect                   `json:"rect"`
	Options  map[string]interface{} `json:"options"`
	Rotation float64                `json:"rotation"`
}

//Rect helper struct for positions
type Rect struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

func titleToSlug(title string) string {
	title = strings.ToLower(title)                //convert upper case to lower case
	title = strings.TrimSpace(title)              //remove preceeding and trailing whitespace
	dashSpaceMatch := regexp.MustCompile(`[_\s]`) //convert spaces and underscores to dashes
	title = dashSpaceMatch.ReplaceAllString(title, "-")
	unwantedMatch := regexp.MustCompile(`[^a-z0-9\-]`) //Remove any other characters
	title = unwantedMatch.ReplaceAllString(title, "")

	return title
}

func arrayContains(array []string, value string) bool {
	for _, v := range array {
		if v == value {
			return true
		}
	}
	return false
}

func ReadDashboardDir(dirname string) ([]Dashboard, error) {
	files, err := os.ReadDir(dirname)
	if err != nil {
		return nil, err
	}
	var dashboards []Dashboard
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".json") {
			continue
		}
		d, err := ReadDashboard(path.Join("dashboards", file.Name()))
		if err != nil {
			return dashboards, err
		}
		dashboards = append(dashboards, d)
	}
	return dashboards, nil
}

func ReadDashboard(name string) (Dashboard, error) {
	f, err := os.Open(name)
	if err != nil {
		return Dashboard{}, err
	}
	defer f.Close()
	var dashboard Dashboard
	if err := json.NewDecoder(f).Decode(&dashboard); err != nil {
		return Dashboard{}, fmt.Errorf("decode dashboard %s: %w", f.Name(), err)
	}
	dashboard.Slug = titleToSlug(dashboard.Title)
	return dashboard, nil
}

func CreateDashboard(name string, dashboard *Dashboard) error {
	dashboard.Slug = titleToSlug(dashboard.Title)
	f, err := os.Create(name)
	if err != nil {
		return fmt.Errorf("create dashboard file: %v", err)
	}
	defer f.Close()
	if err := json.NewEncoder(f).Encode(&dashboard); err != nil {
		return fmt.Errorf("write dashboard file: %w", err)
	}
	return nil
}

func Tagged(dashboards []Dashboard, tag string) []Dashboard {
	var matches []Dashboard
	for _, dash := range dashboards {
		if arrayContains(dash.Tags, tag) {
			matches = append(matches, dash)
		}
	}
	return matches
}

func handleListDashboards(w http.ResponseWriter, r *http.Request) {
	dashboards, err := ReadDashboardDir("dashboards")
	if err != nil {
		msg := fmt.Sprintf("read dashboard directory: %v", err)
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
	}

	tag := r.URL.Query().Get("tag")
	if tag != "" {
		dashboards = Tagged(dashboards, tag)
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

//SlugResponse contains the slug for the client to route to
type SlugResponse struct {
	Slug string `json:"slug"`
}

func handleCreateDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	if req.PostForm.Get("title") == "" {
		http.Error(w, "empty name", http.StatusBadRequest)
		return
	}

	var dashboard Dashboard
	for k := range req.PostForm {
		switch v := req.PostForm.Get(k); k {
		case "title":
			dashboard.Title = v
			dashboard.Slug = titleToSlug(dashboard.Title)
		default:
			http.Error(w, fmt.Sprintf("unknown parameter %s", k), http.StatusBadRequest)
			return
		}
	}

	fpath := path.Join("dashboards", dashboard.Slug+".json")
	if err := CreateDashboard(fpath, &dashboard); err != nil {
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
		http.Error(w, "missing soure dashboard slug", http.StatusBadRequest)
		return
	}

	srcPath := path.Join("dashboards", req.PostForm.Get("src")+".json")
	src, err := ReadDashboard(srcPath)
	if err != nil {
		msg := fmt.Sprintf("read source dashboard from %s: %v", srcPath, err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	dest := src
	dest.Title = req.PostForm.Get("title")
	dest.Slug = titleToSlug(dest.Title)
	destPath := path.Join("dashboards", dest.Slug+".json")
	if err := CreateDashboard(destPath, &dest); err != nil {
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

	//Decode body
	var dashboard Dashboard
	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)
	err := json.Unmarshal(buf.Bytes(), &dashboard)
	if err != nil {
		log.Println("JSON decode failure:", err)
		http.Error(w, "Error decoding json body: "+err.Error(), http.StatusBadRequest)
		return
	}

	//Set dimension of background
	width, height, err := getImageDimension(trimFirstRune(dashboard.Background))
	if err != nil {
		dashboard.Background = ""
	}
	dashboard.Height = strconv.Itoa(height)
	dashboard.Width = strconv.Itoa(width)

	//Convert title to slug
	slugNew := titleToSlug(dashboard.Title)
	if len(slug) < 1 {
		log.Println("Slugless URL")
		http.Error(w, "Generated URL must be atleast one character", http.StatusBadRequest)
		return
	}

	//Write updated file
	err = ioutil.WriteFile(path.Join("dashboards", slugNew+".json"), buf.Bytes(), 0655)
	if err != nil {
		log.Println("Error writing file:", err)
		http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Delete old file if slug updated
	if slug != slugNew {
		fmt.Printf("Slug updated %s -> %s deleting old data\n", slug, slugNew)
		err := os.Remove(path.Join("dashboards", slug+".json"))
		if err != nil {
			log.Println("Failed to remove old file:", err)
			http.Error(w, "Failed to remove old file: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	//Write slug to response so we can route to it
	enc := json.NewEncoder(w)
	enc.Encode(SlugResponse{Slug: slugNew})
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
