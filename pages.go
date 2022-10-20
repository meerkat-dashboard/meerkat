package main

import (
	"embed"
	"errors"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"path"
	"runtime/debug"
)

//go:embed template frontend/dist
var content embed.FS

func viewHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/layout.tmpl", "template/view.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func editHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/layout.tmpl", "template/edit.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func rootHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/layout.tmpl", "template/nav.tmpl", "template/index.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Println(err)
	}
}

func createPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/layout.tmpl", "template/nav.tmpl", "template/create.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Println(err)
	}
}

func deletePage(w http.ResponseWriter, req *http.Request) {
	slug, _ := path.Split(req.URL.Path)
	slug = path.Clean(slug)
	fname := path.Join("dashboards", slug+".json")
	dashboard, err := ReadDashboard(fname)
	if errors.Is(err, fs.ErrNotExist) {
		http.Error(w, "no such dashboard "+fname, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "read dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	tmpl, err := template.ParseFS(content, "template/delete.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboard.Title); err != nil {
		log.Println(err)
	}
}

func aboutPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(content, "template/layout.tmpl", "template/about.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	info, ok := debug.ReadBuildInfo()
	if !ok {
		err = tmpl.Execute(w, nil)
	} else {
		err = tmpl.Execute(w, info.Main)
	}
	if err != nil {
		log.Println(err)
	}
}
