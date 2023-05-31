package ui

import (
	"errors"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"

	"github.com/meerkat-dashboard/meerkat"
)

func (srv *Server) ViewHandler(w http.ResponseWriter, req *http.Request) {
	slug := path.Dir(req.URL.Path)
	fname := path.Join("dashboards", slug+".json")
	dashboard, err := meerkat.ReadDashboard(fname)
	if errors.Is(err, fs.ErrNotExist) {
		http.NotFound(w, req)
		return
	} else if err != nil {
		msg := fmt.Sprintf("read dashboard %s: %v", slug, err)
		log.Print(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/view.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, dashboard)
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

	groupedDashboards := groupDashboardsByFolder(dashboards)

	// Get and sort the folder names
	folderNames := make([]string, 0, len(groupedDashboards))
	for folderName := range groupedDashboards {
		folderNames = append(folderNames, folderName)
	}
	sort.Strings(folderNames)

	data := struct {
		Folders     []string
		Dashboards  DashboardGroup
	}{
		Folders:    folderNames,
		Dashboards: groupedDashboards,
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Println(err)
	}
}

type DashboardGroup map[string][]meerkat.Dashboard

func groupDashboardsByFolder(dashboards []meerkat.Dashboard) DashboardGroup {
	grouped := make(DashboardGroup)

	for _, dashboard := range dashboards {
		folder := dashboard.Folder
		if folder == "" {
			folder = "Uncategorized"
		}
		grouped[folder] = append(grouped[folder], dashboard)
	}

	return grouped
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

	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/info.tmpl", "template/nav.tmpl", "template/filemgr_background.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, dashboard); err != nil {
		log.Println(err)
	}
}

func (srv *Server) UploadFileHandler(targetPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get the file from the request
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Unable to read file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// create a new file in the local system
		dst, err := os.Create(filepath.Join(targetPath, header.Filename))
		if err != nil {
			http.Error(w, "Unable to create file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// copy the uploaded file to the new file
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Unable to save file", http.StatusInternalServerError)
			return
		}

		// return the file path
		w.Write([]byte(targetPath + "/" + header.Filename))
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

