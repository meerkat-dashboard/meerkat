package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/meerkat-dashboard/meerkat"
	"github.com/r3labs/sse/v2"
	"golang.org/x/exp/slices"
)

type Requests struct {
	CallMade   string `json:"call_made"`
	CallTime   int64  `json:"call_time"`
	Dashboard  string `json:"dashboard"`
	StatusCode int    `json:"status_code"`
}

type Dashboard struct {
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	Folder          string   `json:"folder"`
	CurrentlyOpenBy []string `json:"currently_open_by"`
}

type Status struct {
	Meerkat struct {
		StartTime  int64       `json:"start_time"`
		Dashboards []Dashboard `json:"dashboards"`
	} `json:"meerkat"`
	Backends struct {
		Icinga struct {
			Type          string `json:"type"`
			Status        string `json:"status"`
			StatusMessage string `json:"status_message"`
			Connections   struct {
				APICalls struct {
					RecentRequestCount int        `json:"recent_request_count"`
					RecentHistory      []Requests `json:"recent_history"`
				} `json:"api_calls"`
				EventStreams struct {
					LastEventReceived  int      `json:"last_event_received"`
					ReceivedEventCount int      `json:"received_count_1min"`
					RecentHistory      []Events `json:"recent_history"`
				} `json:"event_streams"`
			} `json:"connections"`
		} `json:"icinga"`
	} `json:"backends"`
}

func UpdateHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	name := strings.Split(path.Dir(req.URL.Path), "/")[1]
	log.Printf("Updated %s dashboards\n", name)
	server.Publish("updates", &sse.Event{
		Data: []byte(name),
	})
	w.WriteHeader(200)
}
func SetWorking() {
	server.Publish("updates", &sse.Event{
		Data: []byte("icinga-success"),
	})
	status.Backends.Icinga.Status = "working"
}

func UpdateAll() {
	log.Println("Updating all meerkat dashboards")
	server.Publish("updates", &sse.Event{
		Data: []byte("update"),
	})
}

func SendError() {
	log.Println("Sending icinga backend error to clients.")
	server.Publish("updates", &sse.Event{
		Data: []byte("icinga-error"),
	})
	status.Backends.Icinga.Status = "failed"
}

func SendHeartbeat() {
	server.Publish("updates", &sse.Event{
		Data: []byte("heartbeat"),
	})
}

func handleListDashboard(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	http.ServeFile(w, r, path.Join("dashboards", slug+".json"))
}

func handleCreateDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		log.Println(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	dashboard, err := meerkat.ParseDashboardForm(req.PostForm)
	if err != nil {
		msg := fmt.Sprintf("parse dashboard from form: %v", err)
		log.Println(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	fpath := path.Join("dashboards", dashboard.Slug+".json")
	if err := meerkat.CreateDashboard(fpath, &dashboard); err != nil {
		msg := fmt.Sprintf("create dashboard %s: %v", dashboard.Slug, err)
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	updateDashboardCache(dashboard.Slug)
	log.Printf("Created dashboard %s\n", fpath)
	u := path.Join("/", dashboard.Slug, "edit")
	http.Redirect(w, req, u, http.StatusFound)
}

func handleCloneDashboard(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		msg := fmt.Sprintf("parse form: %v", err)
		log.Println(msg)
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
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	dest := src
	dest.Title = req.PostForm.Get("title")
	dest.Slug = meerkat.TitleToSlug(dest.Title)
	destPath := path.Join("dashboards", dest.Slug+".json")

	if err := meerkat.CreateDashboard(destPath, &dest); err != nil {
		msg := fmt.Sprintf("create dashboard from %s: %v", srcPath, err)
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	updateDashboardCache(dest.Slug)
	log.Printf("Cloned dashboard %s\n", destPath)
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
	updateDashboardCache(slug)
	log.Printf("Updated dashboard %s\n", path.Join("dashboards", slug+".json"))
}

func handleDeleteDashboard(w http.ResponseWriter, req *http.Request) {
	mapLock.Lock()
	defer mapLock.Unlock()
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

	cache.Del(slug)
	server.RemoveStream(slug)
	delete(dashboardCache, slug)
	log.Printf("Deleted dashboard %s\n", fname)
	http.RedirectHandler("/", http.StatusFound).ServeHTTP(w, req)
}

func imageDimensions(ref string) (width, height int, err error) {
	if strings.HasPrefix(ref, "/dashboards-background") {
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
		log.Println(err)
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

type LastCheckResult struct {
	Output          string `json:"output"`
	PerformanceData any    `json:"performance_data"`
	State           int    `json:"state"`
	Type            string `json:"type"`
}

type Attr struct {
	Name             string          `json:"__name"`
	Acknowledgement  int             `json:"acknowledgement"`
	LastCheckResults LastCheckResult `json:"last_check_result"`
	State            int             `json:"state"`
	StateType        int             `json:"state_type"`
	Type             string          `json:"type"`
}

type Result struct {
	Attrs Attr   `json:"attrs"`
	Name  string `json:"name"`
	Type  string `json:"type"`
}

type ObjectResults struct {
	Results []Result `json:"results"`
}

type ErrorPage struct {
	Error  int    `json:"error"`
	Status string `json:"status"`
}

func eventToRequest(event Event, objectName string, objectType string) Result {
	ack := 0
	if event.Acknowledgement {
		ack = 1
	}

	return Result{
		Attrs: Attr{
			Name:            objectName,
			Acknowledgement: ack,
			LastCheckResults: LastCheckResult{
				Output:          event.CheckResult.Output,
				PerformanceData: event.CheckResult.PerformanceData,
				State:           event.CheckResult.State,
				Type:            objectType,
			},
			State:     event.CheckResult.State,
			StateType: event.CheckResult.VarsAfter.StateType,
			Type:      objectType,
		},
		Name: objectName,
		Type: objectType,
	}
}

func getObjectHandler(w http.ResponseWriter, r *http.Request) {
	objectType := r.URL.Query().Get("type")
	objectName := r.URL.Query().Get("name")
	objectFilter := r.URL.Query().Get("filter")

	dashboardTitle := r.URL.Query().Get("title")

	requestURL := "/v1/objects/" + objectType
	params := url.Values{}

	name := ""

	if objectName != "" {
		params.Set("service", objectName)
		name = objectName
	}

	if objectFilter != "" {
		params.Set("filter", objectFilter)
		name = objectFilter
	}

	slug := strings.Split(dashboardTitle, "/")[1]
	isCached := false
	cachedResults := []Result{}

	mapLock.RLock()
	dashboardCacheCopy := dashboardCache
	mapLock.RUnlock()
	for _, element := range dashboardCacheCopy[slug] {
		if element.Name == name && len(element.Name) != 0 {
			for _, objectName := range element.Objects {
				objectCache, found := cache.Get(objectName)
				if found {
					cachedResults = append(cachedResults, objectCache.(Result))
					isCached = true
				}
			}
		}
	}

	if isCached {
		objects := ObjectResults{
			Results: cachedResults,
		}

		b, err := json.Marshal(objects)
		if err != nil {
			log.Printf("Error: %s\n", err)
			return
		}
		icingaLog.Println("Using cached response:", slug, objectName, objectFilter)
		w.Write(b)
	} else {
		requestURL = requestURL + "?" + strings.ReplaceAll(params.Encode(), "+", "%20")

		response, err := icingaRequest(requestURL, dashboardTitle)
		if err != nil {
			log.Println("Error getting response:", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(response.StatusCode)
		w.Header().Set("content-type", "application/json")
		dec := json.NewDecoder(response.Body)
		defer response.Body.Close()

		if response.StatusCode == 200 {
			var objects ObjectResults
			err := dec.Decode(&objects)
			if err != nil {
				log.Println("Failed to decode response:", err)
			}
			b, err := json.Marshal(objects)
			if err != nil {
				log.Printf("Error: %s\n", err)
				return
			}

			if len(name) != 0 {
				mapLock.Lock()
				defer mapLock.Unlock()
				for i, elementStore := range dashboardCache[slug] {
					if elementStore.Name == name {
						for _, result := range objects.Results {
							cache.Set(result.Attrs.Name, result, 1)
							cache.Wait()
							if !slices.Contains(dashboardCache[slug][i].Objects, result.Attrs.Name) {
								dashboardCache[slug][i].Objects = append(dashboardCache[slug][i].Objects, result.Attrs.Name)
							}
						}
					}
				}
			}

			w.Write(b)
		} else {
			handleError(w, dec, dashboardTitle)
		}
	}
}

func handleError(w http.ResponseWriter, dec *json.Decoder, dashboardTitle string) {
	var errorPage ErrorPage
	err := dec.Decode(&errorPage)
	if errorPage.Error >= 500 || errorPage.Error == 401 || errorPage.Error == 403 {
		log.Printf("Bad response from icinga: %s %v %s", dashboardTitle, errorPage.Error, errorPage.Status)
	}
	if err != nil {
		log.Println("Failed to decode response:", err)
	}
	b, err := json.Marshal(errorPage)
	if err != nil {
		log.Printf("Error: %s\n", err)
		return
	}
	w.Write(b)
}

func getStatusHandler(w http.ResponseWriter, r *http.Request) {
	status.Backends.Icinga.Connections.APICalls.RecentRequestCount = len(requestList)
	status.Backends.Icinga.Connections.APICalls.RecentHistory = requestList

	events := getEvents()
	status.Backends.Icinga.Connections.EventStreams.ReceivedEventCount = len(events)
	status.Backends.Icinga.Connections.EventStreams.RecentHistory = events

	body, err := json.Marshal(status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if _, err := io.Copy(w, bytes.NewReader(body)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func getCacheDashboardHandler(w http.ResponseWriter, r *http.Request) {
	paths := strings.Split(r.URL.Path, "/")
	if len(paths) >= 3 {
		slug := paths[3]
		mapLock.RLock()
		dashboardCacheCopy := dashboardCache
		mapLock.RUnlock()

		body, err := json.Marshal(dashboardCacheCopy[slug])
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		if _, err := io.Copy(w, bytes.NewReader(body)); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Invalid path", http.StatusInternalServerError)
		return
	}
}

func getCacheHandler(w http.ResponseWriter, r *http.Request) {
	mapLock.RLock()
	dashboardCacheCopy := dashboardCache
	mapLock.RUnlock()

	body, err := json.Marshal(dashboardCacheCopy)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	if _, err := io.Copy(w, bytes.NewReader(body)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func clearCacheHandler(w http.ResponseWriter, r *http.Request) {
	clearType := r.URL.Query().Get("clear")

	switch clearType {
	case "dashboard":
		createDashboardCache()
		w.Write([]byte("Cleared dashboard cache"))
	case "object":
		cache.Clear()
		w.Write([]byte("Cleared object cache"))
	default:
		w.Write([]byte("Failed invalid clear parameter"))
	}
}

func getAllHandler(w http.ResponseWriter, r *http.Request) {
	objectType := r.URL.Query().Get("type")
	dashboardTitle := r.URL.Query().Get("title")
	response, err := icingaRequest("/v1/objects/"+objectType+"?attrs=name", dashboardTitle)
	if err != nil {
		log.Println("Error getting response:", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer response.Body.Close()
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Println("Error reading response:", err)
	}
	w.Header().Set("content-type", "application/json")
	w.Write(body)
}

// swapPath takes a file path to a dashboard from a previous Meerkat
// release and returns a path in the newer format.
// For example given the old path "/view/my-network", the new path is "/my-network/view".
func swapPath(old string) string {
	new := path.Join("/", path.Base(old), path.Dir(old))
	return new
}

type StatusCheck struct {
	Results []struct {
		Name     string `json:"name"`
		Perfdata []any  `json:"perfdata"`
		Status   struct {
			IcingaApplication struct {
				App struct {
					EnableEventHandlers bool    `json:"enable_event_handlers"`
					EnableFlapping      bool    `json:"enable_flapping"`
					EnableHostChecks    bool    `json:"enable_host_checks"`
					EnableNotifications bool    `json:"enable_notifications"`
					EnablePerfdata      bool    `json:"enable_perfdata"`
					EnableServiceChecks bool    `json:"enable_service_checks"`
					Environment         string  `json:"environment"`
					NodeName            string  `json:"node_name"`
					Pid                 int     `json:"pid"`
					ProgramStart        float64 `json:"program_start"`
				} `json:"app"`
			} `json:"icingaapplication"`
		} `json:"status"`
	} `json:"results"`
}

func addRequest(request Requests) {
	if len(requestList) >= 100 {
		requestList = requestList[1:]
	}

	requestList = append(requestList, request)
}

func icingaRequest(apiPath string, dashboardTitle string) (*http.Response, error) {
	client := &http.Client{}
	if config.IcingaInsecureTLS {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}
	icingaURL, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Println("Failed to parse IcingaURL:", err)
		return nil, err
	}

	pathURL, err := url.Parse(apiPath)
	if err != nil {
		log.Println("Failed to parse API Path:", err)
		return nil, err
	}
	if config.IcingaDebug {
		icingaLog.Printf("Requesting %s for %s\n", icingaURL.ResolveReference(pathURL).String(), dashboardTitle)
	}
	req, err := http.NewRequest("GET", icingaURL.ResolveReference(pathURL).String(), nil)
	req.Header.Set("accept", "application/json")
	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)
	if err != nil {
		log.Println("Failed to create request:", err)
		addRequest(Requests{CallMade: apiPath, CallTime: time.Now().UnixMilli(), Dashboard: dashboardTitle, StatusCode: 0})
		return nil, err
	}

	res, err := client.Do(req)

	if err != nil {
		log.Println("Icinga2 API error:", err)
		addRequest(Requests{CallMade: apiPath, CallTime: time.Now().UnixMilli(), Dashboard: dashboardTitle, StatusCode: 0})
		return nil, err
	}

	addRequest(Requests{CallMade: apiPath, CallTime: time.Now().UnixMilli(), Dashboard: dashboardTitle, StatusCode: res.StatusCode})

	return res, nil
}

func checkProgramStart() float64 {
	var statusCheck StatusCheck
	response, err := icingaRequest("/v1/status/IcingaApplication", config.HTTPAddr)
	if err != nil {
		// Handle error (for example, by logging it and returning a default value)
		log.Println("Failed to make request:", err)
		return 0
	}
	defer response.Body.Close()
	b, err := io.ReadAll(response.Body)
	if err != nil {
		log.Println("Failed to read response:", err)
		return 0
	}
	err = json.Unmarshal(b, &statusCheck)
	if err != nil {
		log.Println("Failed to unmarshall response:", err)
		return 0
	}
	for _, v := range statusCheck.Results {
		return v.Status.IcingaApplication.App.ProgramStart
	}
	return 0
}
