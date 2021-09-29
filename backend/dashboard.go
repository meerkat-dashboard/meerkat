package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi"
)

//Dashboard contains all information to render a dashboard
type Dashboard struct {
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	Background    string    `json:"background"`
	Width         string    `json:"width"`
	Height        string    `json:"height"`
	Tags          []string  `json:"tags"`
	Elements      []Element `json:"elements"`
	GlobalMute    bool      `json:"globalMute"`
	OkSound       string    `json:"okSound"`
	CriticalSound string    `json:"criticalSound"`
	WarningSound  string    `json:"warningSound"`
	UnknownSound  string    `json:"unknownSound"`
	UpSound       string    `json:"upSound"`
	DownSound     string    `json:"downSound"`
}

//Element contains any service/host information needed
type Element struct {
	Type     string  `json:"type"`
	Title    string  `json:"title"`
	Rect     Rect    `json:"rect"`
	Options  Option  `json:"options"`
	Rotation float64 `json:"rotation"`
}

//Option contains element options
type Option struct {
	Filter                          string `json:"filter"`
	ObjectType                      string `json:"objectType"`
	Selection                       string `json:"selection"`
	CheckID                         string `json:"checkId"`
	NameFontSize                    int    `json:"nameFontSize"`
	StatusFontSize                  int    `json:"statusFontSize"`
	RightArrow                      bool   `json:"rightArrow"`
	LeftArrow                       bool   `json:"leftArrow"`
	StrokeWidth                     int    `json:"strokeWidth"`
	Image                           string `json:"image"`
	OKSvg                           string `json:"okSvg"`
	OKStrokeAcknowledgedColor       string `json:"okStrokeAcknowledgedColor"`
	OKStrokeColor                   string `json:"okStrokeColor"`
	WarningAcknowledgedStrokeColor  string `json:"warningAcknowledgedStrokeColor"`
	WarningSvg                      string `json:"warningSvg"`
	UnknownAcknowledgedStrokeColor  string `json:"unknownAcknowledgedStrokeColor"`
	UnknownSvg                      string `json:"unknownSvg"`
	CriticalStrokeColor             string `json:"criticalStrokeColor"`
	CriticalAcknowledgedStrokeColor string `json:"criticalAcknowledgedStrokeColor"`
	CriticalSvg                     string `json:"criticalSvg"`
	CriticalImage                   string `json:"criticalImage"`
	CriticalAcknowledgedImage       string `json:"criticalAcknowledgedImage"`
	OkImage                         string `json:"okImage"`
	UnknownImage                    string `json:"unknownImage"`
	UnknownAcknowledgedImage        string `json:"unknownAcknowledgedImage"`
	WarningImage                    string `json:"warningImage"`
	WarningAcknowledgedImage        string `json:"warningAcknowledgedImage"`
	Svg                             string `json:"svg"`
	StrokeColor                     string `json:"strokeColor"`
	Source                          string `json:"source"`
	AudioSource                     string `json:"audioSource"`
	Text                            string `json:"text"`
	BackgroundColor                 string `json:"backgroundColor"`
	TextAlign                       string `json:"textAlign"`
	TextVerticalAlign               string `json:"textVerticalAlign"`
	FontColor                       string `json:"fontColor"`
	FontSize                        string `json:"fontSize"`
	ScrollPeriod                    string `json:"scrollPeriod"`
	LinkURL                         string `json:"linkURL"`
	OkSound                         string `json:"okSound"`
	WarningSound                    string `json:"warningSound"`
	UnknownSound                    string `json:"unknownSound"`
	CriticalSound                   string `json:"criticalSound"`
	UpSound                         string `json:"upSound"`
	DownSound                       string `json:"downSound"`
	MuteAlerts                      bool   `json:"muteAlerts"`
	CheckDataSelection              string `json:"checkDataSelection"`
	CheckDataPattern                string `json:"checkDataPattern"`
	CheckDataDefault                string `json:"checkDataDefault"`
	Dynamic                         bool   `json:"dynamic"`
	ID                              string `json:"id"`
	DynamicText                     string `json:"dynamicText"`
	DynamicText2                    string `json:"dynamicText2"`
	DynamicText2Structure           bool   `json:"dynamicText2Structure"`
	BoldText                        bool   `json:"boldText"`
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

func slugFromFileName(fileName string) string {
	return strings.TrimSuffix(fileName, filepath.Ext(fileName))
}

func handleListDashboards(w http.ResponseWriter, r *http.Request) {
	files, err := ioutil.ReadDir("dashboards")
	if err != nil {
		log.Printf("Failed to read directory: %w", err.Error())
		http.Error(w, "Failed to read directory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var dashboards = []Dashboard{}
	tagParam := r.URL.Query().Get("tag")

	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".json") {
			data, err := ioutil.ReadFile(path.Join("dashboards", f.Name()))
			if err != nil {
				log.Printf("Error reading file contents: %w", err.Error())
				http.Error(w, "Error reading file contents: "+err.Error(), http.StatusInternalServerError)
				return
			}

			var dashboard Dashboard
			err = json.Unmarshal(data, &dashboard)
			//skip files with invalid json
			if err != nil {
				log.Printf("Invalid dashboard file %s: %w", f.Name(), err)
				http.Error(w, "Invalid file: "+err.Error(), http.StatusInternalServerError)
				continue
			}

			dashboard.Slug = slugFromFileName(f.Name())

			if tagParam != "" {
				if arrayContains(dashboard.Tags, tagParam) {
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
		log.Printf("Error encoding response: %s\n", err)
	}
}

func handleListDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	//Check dashboard exists
	if f, err := os.Open(path.Join("dashboards", slug+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Error checking that file exists: %w", err.Error())
		http.Error(w, "Error checking file exists: "+err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.Header().Add("content-type", "application/json")
		defer f.Close()
		_, err = io.Copy(w, f)
		if err != nil {
			log.Printf("Error writing response: %w", err.Error())
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
		log.Printf("JSON body decode failure: %w", err.Error())
		http.Error(w, "Error decoding json body: "+err.Error(), http.StatusBadRequest)
		return
	}

	//Conver title to slug
	slug := titleToSlug(dashboard.Title)
	if len(slug) < 1 {
		log.Printf("Slugless URL")
		http.Error(w, "Generated URL must be atleast one character", http.StatusBadRequest)
		return
	}

	outputFile := path.Join("dashboards", slug+".json")

	//Check dashboard exists
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		// path/to/whatever does not exist
		err = ioutil.WriteFile(outputFile, buf.Bytes(), 0655)
		if err != nil {
			log.Printf("Error writing file: %w", err.Error())
			http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		log.Printf("Error checking file exists: %w", err.Error())
		http.Error(w, "Error checking file exists: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Return slug
	enc := json.NewEncoder(w)
	enc.Encode(SlugResponse{Slug: slug})
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
		log.Printf("JSON decode failure: %w", err.Error())
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
		log.Printf("Slugless URL")
		http.Error(w, "Generated URL must be atleast one character", http.StatusBadRequest)
		return
	}

	//Write updated file
	err = ioutil.WriteFile(path.Join("dashboards", slugNew+".json"), buf.Bytes(), 0655)
	if err != nil {
		log.Printf("Error writing file: %w", err.Error())
		http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Delete old file if slug updated
	if slug != slugNew {
		fmt.Printf("Slug updated %s -> %s deleting old data\n", slug, slugNew)
		err := os.Remove(path.Join("dashboards", slug+".json"))
		if err != nil {
			log.Printf("Failed to remove old file: %w", err.Error())
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
		log.Printf("Failed to remove old file: %w", err.Error())
		http.Error(w, "Failed to remove old file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
