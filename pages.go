package main

import (
	"embed"
	"html/template"
	"net/http"
)

//go:embed template frontend/dist
var content embed.FS

func viewHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/view.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func editHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/edit.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func rootHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/index.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}
