package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
)

type uploadResponse struct {
	URL   string `json:"url"`
	Error string `json:"error"`
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	newFile, err := writeUploadedFile(r.Header.Get("filename"), r.Body)
	resp := uploadResponse{
		URL: path.Join("/", newFile),
	}
	if err != nil {
		resp.Error = err.Error()
	}
	json.NewEncoder(w).Encode(resp)
}

// writeUploadedFile writes the named file to the default dashboard data directory.
// The path to the file along with any errors are returned.
func writeUploadedFile(name string, src io.Reader) (string, error) {
	buf := &bytes.Buffer{}
	_, err := io.Copy(buf, src)
	if err != nil {
		return "", fmt.Errorf("read uploaded file: %w", err)
	}
	hash := sha256Hash(buf.Bytes())
	diskName := path.Join("dashboards-data", hash+filepath.Ext(name))
	err = os.WriteFile(diskName, buf.Bytes(), 0644)
	return diskName, err
}

// sha256Hash returns sha256 hash of all data from r as a string
// truncated to 16 characters.
func sha256Hash(buf []byte) string {
	hash := sha256.New()
	hash.Write(buf)
	return fmt.Sprintf("%x", hash.Sum(nil)[:16])
}
