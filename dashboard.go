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
	"strconv"
	"strings"
)

// Dashboard contains all information to render a dashboard
type Dashboard struct {
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	Background    string    `json:"background"`
	Description   string    `json:"description"`
	Folder        string    `json:"folder"`
	Width         string    `json:"width"`
	Height        string    `json:"height"`
	GlobalMute    bool      `json:"globalMute"`
	OkSound       string    `json:"okSound"`
	WarningSound  string    `json:"warningSound"`
	CriticalSound string    `json:"criticalSound"`
	UnknownSound  string    `json:"unknownSound"`
	UpSound       string    `json:"upSound"`
	DownSound     string    `json:"downSound"`
	Elements      []Element `json:"elements"`
}

// Element contains any service/host information needed
type Element struct {
	Type     string  `json:"type"`
	Title    string  `json:"title"`
	Rect     Rect    `json:"rect"`
	Options  Options `json:"options,omitempty"`
	Rotation float64 `json:"rotation"`
}

type Options struct {
	ObjectAttr                      string `json:"objectAttr,omitempty"`
	ObjectName                      string `json:"objectName,omitempty"`
	ObjectType                      string `json:"objectType,omitempty"`
	TimeZone                        string `json:"timeZone,omitempty"`
	FontSize                        string `json:"fontSize,omitempty"`
	Image                           string `json:"image,omitempty"`
	Source                          string `json:"source,omitempty"`
	AudioSource                     string `json:"audioSource,omitempty"`
	LinkUrl                         string `json:"linkURL,omitempty"`
	ObjectAttrMatch                 string `json:"objectAttrMatch,omitempty"`
	ObjectAttrNoMatch               string `json:"objectAttrNoMatch,omitempty"`
	BoldText                        string `json:"boldText,omitempty"`
	Text                            string `json:"text,omitempty"`
	ScrollPeriod                    string `json:"scrollPeriod,omitempty"`
	BackgroundColor                 string `json:"backgroundColor,omitempty"`
	FontColor                       string `json:"fontColor,omitempty"`
	OkFontColor                     string `json:"okFontColor,omitempty"`
	WarningFontColor                string `json:"warningFontColor,omitempty"`
	WarningAcknowledgedFontColor    string `json:"warningAcknowledgedFontColor,omitempty"`
	UnknownFontColor                string `json:"unknownFontColor,omitempty"`
	UnknownAcknowledgedFontColor    string `json:"unknownAcknowledgedFontColor,omitempty"`
	CriticalFontColor               string `json:"criticalFontColor,omitempty"`
	CriticalAcknowledgedFontColor   string `json:"criticalAcknowledgedFontColor,omitempty"`
	TextAlign                       string `json:"textAlign,omitempty"`
	TextVerticalAlign               string `json:"textVerticalAlign,omitempty"`
	OkSound                         string `json:"okSound,omitempty"`
	WarningSound                    string `json:"warningSound,omitempty"`
	UnknownSound                    string `json:"unknownSound,omitempty"`
	CriticalSound                   string `json:"criticalSound,omitempty"`
	UpSound                         string `json:"upSound,omitempty"`
	DownSound                       string `json:"downSound,omitempty"`
	StrokeWidth                     string `json:"strokeWidth,omitempty"`
	RightArrow                      string `json:"rightArrow,omitempty"`
	LeftArrow                       string `json:"leftArrow,omitempty"`
	OkSvg                           string `json:"okSvg,omitempty"`
	OkStrokeColor                   string `json:"okStrokeColor,omitempty"`
	WarningSvg                      string `json:"warningSvg,omitempty"`
	WarningStrokeColor              string `json:"warningStrokeColor,omitempty"`
	WarningAcknowledgedStrokeColor  string `json:"warningAcknowledgedStrokeColor,omitempty"`
	UnknownSvg                      string `json:"unknownSvg,omitempty"`
	UnknownStrokeColor              string `json:"unknownStrokeColor,omitempty"`
	UnknownAcknowledgedStrokeColor  string `json:"unknownAcknowledgedStrokeColor,omitempty"`
	CriticalSvg                     string `json:"criticalSvg,omitempty"`
	CriticalStrokeColor             string `json:"criticalStrokeColor,omitempty"`
	CriticalAcknowledgedStrokeColor string `json:"criticalAcknowledgedStrokeColor,omitempty"`
	StrokeColor                     string `json:"strokeColor,omitempty"`
	Svg                             string `json:"svg,omitempty"`
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
		case "globalMute":
			dashboard.GlobalMute, _ = strconv.ParseBool(v)
		case "okSound":
			dashboard.OkSound = v
		case "warningSound":
			dashboard.WarningSound = v
		case "criticalSound":
			dashboard.CriticalSound = v
		case "unknownSound":
			dashboard.UnknownSound = v
		case "upSound":
			dashboard.UpSound = v
		case "downSound":
			dashboard.DownSound = v
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
