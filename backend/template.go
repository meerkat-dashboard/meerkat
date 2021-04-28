package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
)

func handleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	qs := []string{}

	templateID := r.URL.Query().Get("templateid")

	if templateID == "" {
		http.Error(w, "Template id must supplied", http.StatusBadRequest)
		return
	}

	if _, err := os.Stat(path.Join("dashboards", templateID+".json")); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	dash, _ := ioutil.ReadFile(path.Join("dashboards", templateID+".json"))

	var dashboard map[string]interface{}

	err := json.Unmarshal([]byte(dash), &dashboard)

	if err != nil {
		log.Printf("Error processing json: %w", err.Error())
		http.Error(w, "Error processing json: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if variable, ok := dashboard["variables"]; ok {
		for key := range variable.(map[string]interface{}) {
			qs = append(qs, key)
		}
	}

	var dashboardX Dashboard
	json.Unmarshal([]byte(dash), &dashboardX)

	for i := range dashboardX.Elements {
		for _, sqs := range qs {
			if strings.Contains(dashboardX.Elements[i].Options.Filter, fmt.Sprint("~", sqs, "~")) {
				reg, err := regexp.Compile(fmt.Sprint("~(", sqs, ")~"))

				if err != nil {
					log.Printf("Error compiling regex: %w", err.Error())
				}

				if r.URL.Query().Get(sqs) != "" {
					dashboardX.Elements[i].Options.Filter = reg.ReplaceAllString(dashboardX.Elements[i].Options.Filter, fmt.Sprint("~", r.URL.Query().Get(sqs), "~"))
				}
			}
		}
	}

	enc := json.NewEncoder(w)
	enc.Encode(dashboardX)
}
