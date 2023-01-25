package ui

import (
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"

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

	dashboards, err := meerkat.ReadDashboardDir("dashboards")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboards); err != nil {
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

func (srv *Server) InfoPage(w http.ResponseWriter, req *http.Request) {
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

	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/info.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboard); err != nil {
		log.Println(err)
	}
}

func (srv *Server) EditInfoHandler(w http.ResponseWriter, req *http.Request) {
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
	if err := req.ParseForm(); err != nil {
		http.Error(w, fmt.Sprintf("parse form: %v", err), http.StatusBadRequest)
		return
	}

	newdash, err := meerkat.ParseDashboardForm(req.PostForm)
	if err != nil {
		msg := fmt.Sprintf("parse dashboard form: %v", err)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	if dashboard.Title != newdash.Title {
		old := fname
		slug = newdash.Slug
		fname = path.Join("dashboards", slug+".json")
		// Don't rename to a dashboard that already exists.
		if _, err := meerkat.ReadDashboard(fname); err == nil {
			msg := fmt.Sprintf("dashboard %s already exists", slug)
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
		defer func() {
			if err := os.Remove(old); err != nil {
				log.Printf("remove old dashboard %s after rename: %v", fname, err)
			}
		}()
	}

	dashboard.Title = newdash.Title
	dashboard.Background = newdash.Background
	err = meerkat.CreateDashboard(fname, &dashboard)
	if err != nil {
		msg := fmt.Sprintf("edit dashboard info: %v", err)
		log.Print(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	url := path.Join("/", slug, "info")
	http.Redirect(w, req, url, http.StatusFound)
}

func (srv *Server) AboutPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/about.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = tmpl.Execute(w, meerkat.BuildString())
	if err != nil {
		log.Println(err)
	}
}

func (srv *Server) FileServer() http.Handler {
	return http.FileServer(http.FS(srv.fsys))
}
