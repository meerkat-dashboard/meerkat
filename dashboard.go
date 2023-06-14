package meerkat

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/url"
	"os"
	"path"
	"regexp"
	"strings"
)

// Dashboard contains all information to render a dashboard
type Dashboard struct {
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Background  string    `json:"background"`
	Description string    `json:"description"`
	Folder      string    `json:"folder"`
	Width       string    `json:"width"`
	Height      string    `json:"height"`
	Elements    []Element `json:"elements"`
}

// Element contains any service/host information needed
type Element struct {
	Type     string                 `json:"type"`
	Title    string                 `json:"title"`
	Rect     Rect                   `json:"rect"`
	Options  map[string]interface{} `json:"options"`
	Rotation float64                `json:"rotation"`
}

// Rect helper struct for positions
type Rect struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

// Stat satisfies the fs.File interface.
func (d *Dashboard) Stat() (fs.FileInfo, error) {
	return os.Stat(path.Join("dashboards", TitleToSlug(d.Title)+".json"))
}

func ReadDirectory(dirname string) ([]string, error) {
	files, err := os.ReadDir(dirname)
	if err != nil {
		return nil, err
	}
	var list []string
	for _, file := range files {
		list = append(list, file.Name())
	}
	return list, nil
}

func ReadDashboardDir(dirname string) ([]Dashboard, error) {
	files, err := os.ReadDir(dirname)
	if err != nil {
		return nil, err
	}
	var dashboards []Dashboard
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".json") {
			continue
		}
		d, err := ReadDashboard(path.Join("dashboards", file.Name()))
		if err != nil {
			return dashboards, err
		}
		dashboards = append(dashboards, d)
	}
	return dashboards, nil
}

func ReadDashboard(name string) (Dashboard, error) {
	f, err := os.Open(name)
	if err != nil {
		return Dashboard{}, err
	}
	defer f.Close()
	var dashboard Dashboard
	if err := json.NewDecoder(f).Decode(&dashboard); err != nil {
		return Dashboard{}, fmt.Errorf("decode dashboard %s: %w", f.Name(), err)
	}
	dashboard.Slug = TitleToSlug(dashboard.Title)
	return dashboard, nil
}

// CreateDashboard writes the provided dashboard to the named file.
// The file is always truncated beforehand.
func CreateDashboard(name string, dashboard *Dashboard) error {
	dashboard.Slug = TitleToSlug(dashboard.Title)
	buf, err := json.MarshalIndent(&dashboard, "", "  ")
	if err != nil {
		return err
	}
	f, err := os.Create(name)
	if err != nil {
		return fmt.Errorf("create dashboard file: %v", err)
	}
	defer f.Close()
	if _, err := f.Write(buf); err != nil {
		return fmt.Errorf("write dashboard file: %w", err)
	}
	return nil
}

func TitleToSlug(title string) string {
	title = strings.ToLower(title)                //convert upper case to lower case
	title = strings.TrimSpace(title)              //remove preceeding and trailing whitespace
	dashSpaceMatch := regexp.MustCompile(`[_\s]`) //convert spaces and underscores to dashes
	title = dashSpaceMatch.ReplaceAllString(title, "-")
	unwantedMatch := regexp.MustCompile(`[^a-z0-9\-]`) //Remove any other characters
	title = unwantedMatch.ReplaceAllString(title, "")

	return title
}

func ParseDashboardForm(form url.Values) (Dashboard, error) {
	var dashboard Dashboard
	for k := range form {
		switch v := form.Get(k); k {
		case "title":
			if v == "" {
				return Dashboard{}, errors.New("empty title")
			} else if v == "edit" || v == "view" {
				return Dashboard{}, errors.New("reserved title for backwards compatibility")
			}
			dashboard.Title = v
			dashboard.Slug = TitleToSlug(v)
			if dashboard.Slug == "" {
				return Dashboard{}, fmt.Errorf("empty slug from title %s", v)
			}
		case "background":
			dashboard.Background = v
		case "description":
			dashboard.Description = v
		case "folder":
			dashboard.Folder = v
		default:
			return Dashboard{}, fmt.Errorf("unknown form parameter %s", k)
		}
	}
	return dashboard, nil
}

func arrayContains(array []string, value string) bool {
	for _, v := range array {
		if v == value {
			return true
		}
	}
	return false
}
