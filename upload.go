package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"path"
	"path/filepath"
)

//ResponseURL helper struct to send return URLs to the client
//TODO change to hash, and fix frontend
type ResponseURL struct {
	URL string `json:"url"`
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	extension := filepath.Ext(r.Header.Get("filename"))

	buf := new(bytes.Buffer)
	buf.ReadFrom(r.Body)
	contents := buf.Bytes()

	h := sha256.New()
	h.Write(contents)
	hash := fmt.Sprintf("%x", h.Sum(nil)[0:16])

	filepath := path.Join("dashboards-data", hash+extension)
	err := ioutil.WriteFile(filepath, contents, 0655)
	if err != nil {
		fmt.Printf("error writing to file %s\n", err)
		http.Error(w, "error writing to file %s\n", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Created file %s\n", filepath)
	enc := json.NewEncoder(w)
	enc.Encode(ResponseURL{URL: path.Join("/", filepath)})
}
