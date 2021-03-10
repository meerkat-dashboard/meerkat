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
)

type Settings struct {
	AppName string `json:"appName"`
}

func handleChangeSettings(w http.ResponseWriter, r *http.Request) {
	//Decode body
	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)

	var settings Settings
	err := json.Unmarshal(buf.Bytes(), &settings)
	if err != nil {
		log.Printf("JSON body decode failure: %w", err.Error())
		http.Error(w, "Error decoding json body: "+err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println(settings)

	outputFile := path.Join("config", "settings.json")

	//Check settings exists
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
	} else {
		ioutil.WriteFile(outputFile, buf.Bytes(), 0655)
	}

	var newSettings Settings

	//Return settings
	enc := json.NewEncoder(w)
	enc.Encode(newSettings)
}

func handleGetSettings(w http.ResponseWriter, r *http.Request) {
	//Check Settings exists
	if f, err := os.Open(path.Join("config", "settings.json")); os.IsNotExist(err) {
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
