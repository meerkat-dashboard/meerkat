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
	Name        string   `json:"name"`
	HostName    string   `json:"host_name"`
	DisplayName string   `json:"display_name"`
	Command     string   `json:"check_command"`
	State       float32  `json:"state"`
	Interval    float32  `json:"check_interval"`
	Groups      []string `json:"groups"`
}

func (ir *icingaAPIResult) toIcingaObject() icingaObject {
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

	req_url.Path = path.Join(req_url.Path, "/v1/objects", object_type + "s")
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

	for _, obj := range results.Results {
		if int64(obj.Attributes.State) > max_state {
			max_state = int64(obj.Attributes.State)
		}
	}

	enc := json.NewEncoder(w)
	enc.Encode(max_state)
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
		objs = append(objs, check.toIcingaObject())
	}

	enc := json.NewEncoder(w)
	enc.Encode(objs)
}
