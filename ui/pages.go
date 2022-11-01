package ui

import (
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"path"
	"runtime/debug"

	"github.com/meerkat-dashboard/meerkat"
)

func (srv *Server) ViewHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/view.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func (srv *Server) EditHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/edit.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func (srv *Server) RootHandler(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/nav.tmpl", "template/index.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Println(err)
	}
}

func (srv *Server) CreatePage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/nav.tmpl", "template/create.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Println(err)
	}
}

func (srv *Server) DeletePage(w http.ResponseWriter, req *http.Request) {
	slug, _ := path.Split(req.URL.Path)
	slug = path.Clean(slug)
	fname := path.Join("dashboards", slug+".json")
	dashboard, err := meerkat.ReadDashboard(fname)
	if errors.Is(err, fs.ErrNotExist) {
		http.Error(w, "no such dashboard "+fname, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "read dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/delete.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboard.Title); err != nil {
		log.Println(err)
	}
}

func (srv *Server) ClonePage(w http.ResponseWriter, req *http.Request) {
	dashboards, err := meerkat.ReadDashboardDir("dashboards")
	if err != nil {
		msg := fmt.Sprintf("read dashboard dir: %v", err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/clone.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboards); err != nil {
		log.Println(err)
	}
}

func (srv *Server) AboutPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/about.tmpl", "template/nav.tmpl")
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

func (srv *Server) FileServer() http.Handler {
	return http.FileServer(http.FS(srv.fsys))
}
