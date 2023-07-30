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
	"strings"
	"time"

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
		Folders    []string
		Dashboards DashboardGroup
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

func (srv *Server) CachePage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/cache.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	title := ""
	if err := tmpl.Execute(w, title); err != nil {
		log.Println(err)
	}
}

func (srv *Server) ClonePage(w http.ResponseWriter, req *http.Request) {
	dashboards, err := meerkat.ReadDashboardDir("dashboards")
	if err != nil {
		msg := fmt.Sprintf("read dashboard dir: %v", err)
		log.Println(msg)
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

	backgrounds, err := meerkat.ReadDirectory("dashboards-background")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sounds, err := meerkat.ReadDirectory("dashboards-sound")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Dashboard   meerkat.Dashboard
		Backgrounds []string
		Sounds      []string
	}{
		Dashboard:   dashboard,
		Backgrounds: backgrounds,
		Sounds:      sounds,
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Println(err)
	}
}

func (srv *Server) GetSounds(w http.ResponseWriter, req *http.Request) {
	sounds, err := meerkat.ReadDirectory("dashboards-sound")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte("[\"" + strings.Join(sounds, "\",\"") + "\"]"))
}

func (srv *Server) UploadFileHandler(targetPath string, allowFileType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get the file from the request
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Unable to read file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		sanitizedFilename, err := SanitizeName(header.Filename)
		if err != nil {
			log.Fatal(err)
		}

		// Get the file's MIME type
		buffer := make([]byte, 512)
		file.Read(buffer)
		filetype := http.DetectContentType(buffer)

		// Check the file's type
		if strings.HasPrefix(filetype, allowFileType) {
			http.Error(w, "File type ("+filetype+") is not allowed", http.StatusInternalServerError)
		}

		// create a new file in the local system
		dst, err := os.Create(filepath.Join(targetPath, sanitizedFilename))
		if err != nil {
			http.Error(w, "Unable to create file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// copy the uploaded file to the new file
		file, _, _ = r.FormFile("file")
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Unable to save file", http.StatusInternalServerError)
			return
		}
		log.Println("Uploaded file " + filepath.Join(targetPath, sanitizedFilename))
		// return the file path
		w.Write([]byte(targetPath + "/" + sanitizedFilename))
	}
}

func (srv *Server) DeleteFileHandler(targetPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fileName := r.URL.Query().Get("name")
		log.Println("Deleting file " + filepath.Join(targetPath, fileName))
		err := os.Remove(filepath.Join(targetPath, fileName))
		if err != nil {
			http.Error(w, "Unable to delete file", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
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
		log.Println(msg)
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
			log.Println(msg)
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
	dashboard.Folder = newdash.Folder
	dashboard.Background = newdash.Background
	dashboard.Description = newdash.Description
	dashboard.GlobalMute = newdash.GlobalMute
	dashboard.OkSound = newdash.OkSound
	dashboard.WarningSound = newdash.WarningSound
	dashboard.CriticalSound = newdash.CriticalSound
	dashboard.UnknownSound = newdash.UnknownSound
	dashboard.UpSound = newdash.UpSound
	dashboard.DownSound = newdash.DownSound
	err = meerkat.CreateDashboard(fname, &dashboard)
	if err != nil {
		msg := fmt.Sprintf("edit dashboard info: %v", err)
		log.Print(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	url := path.Join("/", slug, "info")
	log.Printf("Dashboard info updated %s\n", dashboard.Title)
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

func (srv *Server) BackgroundPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/assets.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	backgrounds, err := meerkat.ReadDirectory("dashboards-background")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Assets []string
		Type   string
		Title  string
	}{
		Assets: backgrounds,
		Type:   "image",
		Title:  "Image",
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		log.Println(err)
	}
}

func (srv *Server) SoundPage(w http.ResponseWriter, req *http.Request) {
	tmpl, err := template.ParseFS(srv.fsys, "template/layout.tmpl", "template/assets.tmpl", "template/nav.tmpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sounds, err := meerkat.ReadDirectory("dashboards-sound")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Assets []string
		Type   string
		Title  string
	}{
		Assets: sounds,
		Type:   "sound",
		Title:  "Sound",
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		log.Println(err)
	}
}

func (srv *Server) FileServer() http.Handler {
	return http.FileServer(http.FS(srv.fsys))
}

// Helper functions

// Sanitize filenames so they are safe and timestamped
func SanitizeName(filename string) (string, error) {
	// Check if filename is empty
	if filename == "" {
		return "", errors.New("filename cannot be empty")
	}

	// Get the extension of the file
	ext := filepath.Ext(filename)

	// Remove the extension from the filename
	base := strings.TrimSuffix(filename, ext)

	// Remove any non-alphanumeric character, underscore or dash and replace it with underscore
	base = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, base)

	timestamp := time.Now().Format("060102_150405")
	base = base + "_" + timestamp

	// Append the extension to the sanitized base name
	return base + ext, nil
}
