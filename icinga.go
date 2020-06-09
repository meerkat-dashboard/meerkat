package main

import (
	"crypto/tls"
	"encoding/json"
	"net/http"

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
	DisplayName string   `json:"displayName"`
	Command     string   `json:"checkCommand"`
	State       float32  `json:"state"`
	Interval    float32  `json:"checkInterval"`
	Groups      []string `json:"groups"`
}

//This function isn't very optimized, decodes json -> convert to our type -> re-encode json
func handleIcingaCheck(w http.ResponseWriter, r *http.Request) {
	checkType := chi.URLParam(r, "check-type")
	objectID := r.URL.Query().Get("object-id")

	//We only support looking up hosts and services
	if checkType != "hosts" && checkType != "services" {
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
	url := config.IcingaURL + "/v1/objects/" + checkType
	if objectID != "" {
		url += "/" + objectID
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, "Error creating http request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	//Make request
	res, err := client.Do(req)
	if err != nil {
		http.Error(w, "Icinga2 API error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	var results icingaAPIResults
	dec := json.NewDecoder(res.Body)
	err = dec.Decode(&results)
	if err != nil {
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
