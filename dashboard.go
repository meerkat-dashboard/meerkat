package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"

	"github.com/go-chi/chi"
)

//Dashboard contains all information to render a dashboard
type Dashboard struct {
	Title      string    `json:"title"`
	Background string    `json:"background"`
	Tags       []string  `json:"tags"`
	Elements   []Element `json:"elements"`
}

//Element contains any service/host information needed
type Element struct {
	Type  string `json:"type"`
	Title string `json:"title"`
	Rect  Rect   `json:"rect"`
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

func handleListDashboards(w http.ResponseWriter, r *http.Request) {
	files, err := ioutil.ReadDir("dashboards")
	if err != nil {
		http.Error(w, "Failed to read directory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var dashboards []Dashboard
	tagParam := r.URL.Query().Get("tag")

	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".json") {
			data, err := ioutil.ReadFile(path.Join("dashboards", f.Name()))
			if err != nil {
				http.Error(w, "Error reading file contents: "+err.Error(), http.StatusInternalServerError)
				return
			}

			var dashboard Dashboard
			err = json.Unmarshal(data, &dashboard)
			//skip files with invalid json
			if err != nil {
				http.Error(w, "Invalid file: "+err.Error(), http.StatusInternalServerError)
				fmt.Printf("Invalid dashboard file %s - %s\n", f.Name(), err)
				continue
			}

			tags := dashboard.Tags

			if tagParam != "" {
				if arrayContains(tags, tagParam) {
					dashboards = append(dashboards, dashboard)
				}
			} else {
				dashboards = append(dashboards, dashboard)
			}
		}
	}

	enc := json.NewEncoder(w)
	err = enc.Encode(dashboards)
	if err != nil {
		fmt.Printf("Error encoding response: %s\n", err)
	}
}

func handleListDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Check dashboard exists
	if f, err := os.Open(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Error checking file exists: "+err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.Header().Add("content-type", "application/json")
		defer f.Close()
		_, err = io.Copy(w, f)
		if err != nil {
			http.Error(w, "Error writing response: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

//SlugResponse contains the slug for the client to route to
type SlugResponse struct {
	Slug string `json:"slug"`
}

func handleCreateDashboard(w http.ResponseWriter, r *http.Request) {
	//Decode body
	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)

	var dashboard Dashboard
	err := json.Unmarshal(buf.Bytes(), &dashboard)
	if err != nil {
		http.Error(w, "Error decoding json body: "+err.Error(), http.StatusBadRequest)
		return
	}

	//Conver title to slug
	slug := titleToSlug(dashboard.Title)
	if len(slug) < 1 {
		http.Error(w, "Generated URL must be atleast one character", http.StatusBadRequest)
		return
	}

	outputFile := path.Join("dashboards", slug+".json")

	//Check dashboard exists
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		// path/to/whatever does not exist
		err = ioutil.WriteFile(outputFile, buf.Bytes(), 0655)
		if err != nil {
			http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, "Error checking file exists: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Return slug
	enc := json.NewEncoder(w)
	enc.Encode(SlugResponse{Slug: slug})
}

func handleUpdateDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Decode body
	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)

	var dashboard Dashboard
	err := json.Unmarshal(buf.Bytes(), &dashboard)
	if err != nil {
		http.Error(w, "Error decoding json body: "+err.Error(), http.StatusBadRequest)
		return
	}

	//Check dashboard exists
	if _, err := os.Stat(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	//Convert title to slug
	slugNew := titleToSlug(dashboard.Title)
	if len(slug) < 1 {
		http.Error(w, "Generated URL must be atleast one character", http.StatusBadRequest)
		return
	}

	//Write updated file
	err = ioutil.WriteFile(path.Join("dashboards", slugNew+".json"), buf.Bytes(), 0655)
	if err != nil {
		http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Delete old file if slug updated
	if slug != slugNew {
		fmt.Printf("Slug updated %s -> %s deleting old data\n", slug, slugNew)
		err := os.Remove(path.Join("dashboards", slug+".json"))
		if err != nil {
			http.Error(w, "Failed to remove old file: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	//Write slug to response so we can route to it
	enc := json.NewEncoder(w)
	enc.Encode(SlugResponse{Slug: slugNew})
}

func handleDeleteDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Check dashboard exists
	if _, err := os.Stat(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	fmt.Printf("Deleting dashbaord %s\n", slug)
	err := os.Remove(path.Join("dashboards", slug+".json"))
	if err != nil {
		http.Error(w, "Failed to remove old file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
