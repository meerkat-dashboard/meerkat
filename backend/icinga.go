package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/go-chi/chi"
)

type icingaAPIResults struct {
	Results []icingaAPIResult `json:"results"`
}

type icingaAPIResult struct {
	Attributes icingaAttributes `json:"attrs"`
	Name       string           `json:"name"`
	Type       string           `json:"type"`
}

type icingaAttributes struct {
	Acknowledgement float64  `json:"acknowledgement"`
	Name            string   `json:"name"`
	HostName        string   `json:"host_name"`
	DisplayName     string   `json:"display_name"`
	Command         string   `json:"check_command"`
	State           float32  `json:"state"`
	Interval        float32  `json:"check_interval"`
	Groups          []string `json:"groups"`
}

func (ir *icingaAPIResult) ostsObject() icingaObject {
	return icingaObject{
		ID:          ir.Name,
		Type:        ir.Type,
		Name:        ir.Attributes.Name,
		HostName:    ir.Attributes.HostName,
		DisplayName: ir.Attributes.DisplayName,
		Command:     ir.Attributes.Command,
		State:       ir.Attributes.State,
		Interval:    ir.Attributes.Interval,
		Groups:      ir.Attributes.Groups,
	}
}

type icingaObject struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	HostName    string   `json:"hostName"`
	DisplayName string   `json:"displayName"`
	Command     string   `json:"checkCommand"`
	State       float32  `json:"state"`
	Interval    float32  `json:"checkInterval"`
	Groups      []string `json:"groups"`
}

type icingaAPILastCheckResults struct {
	CheckResults []results `json:"results"`
}

type results struct {
	Attributes icingaCheckAttributes `json:"attrs"`
	Joins      joins                 `json:"joins,omitempty"`
	Meta       types                 `json:"meta,omitempty"`
	Name       string                `json:"name"`
	Type       string                `json:"type"`
}

type joins struct {
}

type types struct {
}

type icingaCheckAttributes struct {
	Attributes checkResult `json:"last_check_result"`
}

type checkResult struct {
	Active          bool       `json:"active"`
	CheckSource     string     `json:"check_source"`
	Command         []string   `json:"command"`
	ExecutionEnd    float64    `json:"execution_end"`
	ExecutionStart  float64    `json:"execution_start"`
	ExitStatus      float64    `json:"exit_status"`
	Output          string     `json:"output"`
	PerformanceData []string   `json:"performance_data"`
	ScheduleEnd     float64    `json:"schedule_end"`
	ScheduleStart   float64    `json:"schedule_start"`
	State           float64    `json:"state"`
	TTL             float64    `json:"ttl"`
	Type            string     `json:"type"`
	VarsAfter       varsAfter  `json:"vars_after"`
	VarsBefore      varsBefore `json:"vars_before"`
}

type varsAfter struct {
	Attempt   float64 `json:"attempt"`
	Reachable bool    `json:"reachable"`
	State     float64 `json:"state"`
	StateType float64 `json:"state_type"`
}

type varsBefore struct {
	Attempt   float64 `json:"attempt"`
	Reachable bool    `json:"reachable"`
	State     float64 `json:"state"`
	StateType float64 `json:"state_type"`
}

type together struct {
	MaxState     int64
	Acknowledged int64
}

func handleCheckResult(w http.ResponseWriter, r *http.Request) {

	object := r.URL.Query().Get("object")
	attrs := r.URL.Query().Get("attrs")
	objType := r.URL.Query().Get("objtype")

	if object == "" {
		http.Error(w, "No unique queue name specified", http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	//Disable TLS verification if config says so
	if config.IcingaInsecureTLS {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}

	//Create HTTP request
	req_url, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Printf("Failed to parse IcingaURL: %w", err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	if objType == "service" {
		req_url.Path = path.Join(req_url.Path, "/v1/objects/services", object)
	} else {
		req_url.Path = path.Join(req_url.Path, "/v1/objects/hosts", object)
	}

	req_url.RawQuery = strings.ReplaceAll(url.Values{"attrs": []string{attrs}}.Encode(), "+", "%20")

	req, err := http.NewRequest("GET", req_url.String(), nil)
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	if err != nil {
		fmt.Println("Failed to create HTTP request: %w", err)
		http.Error(w, "Error creating http request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Make request
	res, err := client.Do(req)
	if err != nil {
		fmt.Println("Icinga2 API error: %w", err.Error())
		http.Error(w, "Icinga2 API error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Println("Response status:", res.Status)

	defer res.Body.Close()

	var checkResults icingaAPILastCheckResults
	dec := json.NewDecoder(res.Body)
	err = dec.Decode(&checkResults)

	if err != nil {
		log.Printf("Error decoding Icinga2 API response: %w", err)
		http.Error(w, "Error decoding Icinga2 API response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	enc := json.NewEncoder(w)
	enc.Encode(checkResults)
}

func handleIcingaCheckState(w http.ResponseWriter, r *http.Request) {
	object_type := r.URL.Query().Get("object_type")
	filter := r.URL.Query().Get("filter")

	if object_type == "" {
		http.Error(w, "No object type specified", http.StatusBadRequest)
		return
	}

	if filter == "" {
		http.Error(w, "No filter specified", http.StatusBadRequest)
		return
	}

	//We only support looking up hosts and services
	if object_type != "host" && object_type != "service" {
		http.Error(w, "Invalid object type", http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	//Disable TLS verification if config says so
	if config.IcingaInsecureTLS {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}

	//Create HTTP request
	req_url, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Printf("Failed to parse IcingaURL: %w", err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	req_url.Path = path.Join(req_url.Path, "/v1/objects", object_type+"s")
	req_url.RawQuery = strings.ReplaceAll(url.Values{"filter": []string{filter}}.Encode(), "+", "%20")

	req, err := http.NewRequest("GET", req_url.String(), nil)
	if err != nil {
		log.Printf("Failed to create HTTP request: %w", err)
		http.Error(w, "Error creating http request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	//Make request
	res, err := client.Do(req)
	if err != nil {
		log.Printf("Icinga2 API error: %w", err.Error())
		http.Error(w, "Icinga2 API error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	defer res.Body.Close()

	var results icingaAPIResults
	dec := json.NewDecoder(res.Body)
	err = dec.Decode(&results)

	if err != nil {
		log.Printf("Error decoding Icinga2 API response: %w", err)
		http.Error(w, "Error decoding Icinga2 API response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if len(results.Results) == 0 {
		http.Error(w, fmt.Sprintf("No %s objects matched filter %s", object_type, filter), http.StatusBadRequest)
		return
	}

	max_state := int64(0)
	acknowledged := int64(0)

	for _, obj := range results.Results {
		if int64(obj.Attributes.Acknowledgement) == 1 {
			acknowledged = int64(obj.Attributes.Acknowledgement)
		}
		if int64(obj.Attributes.State) > max_state {
			max_state = int64(obj.Attributes.State)
			if int64(obj.Attributes.State) == 2 {
				max_state = int64(obj.Attributes.State)
			}
		}
	}

	t := together{MaxState: max_state}
	t.Acknowledged = acknowledged

	enc := json.NewEncoder(w)
	enc.Encode(&t)
}

func handleIcingaCheck(w http.ResponseWriter, r *http.Request) {
	checkType := chi.URLParam(r, "check-type")
	objectID := chi.URLParam(r, "object-id")

	//We only support looking up hosts and services
	if checkType != "hosts" && checkType != "services" && checkType != "hostgroups" && checkType != "servicegroups" {
		http.Error(w, "Endpoint must be 'hosts' or 'services'", http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	//Disable TLS verification if config says so
	if config.IcingaInsecureTLS {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}

	//Create HTTP request
	req_url, err := url.Parse(config.IcingaURL)
	if err != nil {
		log.Printf("Failed to parse IcingaURL: %w", err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	req_url.Path = path.Join(req_url.Path, "/v1/objects", checkType)
	if objectID != "" {
		req_url.Path = path.Join(req_url.Path, objectID)
	}

	if filter := r.URL.Query().Get("filter"); filter != "" {
		req_url.RawQuery = strings.ReplaceAll(url.Values{"filter": []string{filter}}.Encode(), "+", "%20")
		// req_url.RawQuery = strings.ReplaceAll(url.Values{"filter": []string{filter}}.Encode(), "~", "")
	}

	log.Printf("Requesting %s", req_url.String())
	req, err := http.NewRequest("GET", req_url.String(), nil)
	if err != nil {
		log.Printf("Failed to create HTTP request: %w", err)
		http.Error(w, "Error creating http request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	//Make request
	res, err := client.Do(req)
	if err != nil {
		log.Printf("Icinga2 API error: %w", err.Error())
		http.Error(w, "Icinga2 API error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	var results icingaAPIResults
	dec := json.NewDecoder(res.Body)
	err = dec.Decode(&results)
	if err != nil {
		log.Printf("Error decoding Icinga2 API response: %w", err)
		http.Error(w, "Error decoding Icinga2 API response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//Convert to our type
	var objs []icingaObject
	for _, check := range results.Results {
		objs = append(objs, check.ostsObject())
	}

	enc := json.NewEncoder(w)
	enc.Encode(objs)
}
