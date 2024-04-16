package meerkat

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
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
	Order         Order     `json:"order"`
}

type Order struct {
	Ok          int `json:"ok"`
	Warning     int `json:"warning"`
	Critical    int `json:"critical"`
	Unknown     int `json:"unknown"`
	WarningAck  int `json:"warning_ack"`
	CriticalAck int `json:"critical_ack"`
	UnknownAck  int `json:"unknown_ack"`
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
	ObjectAttr                      string      `json:"objectAttr,omitempty"`
	ObjectName                      string      `json:"objectName,omitempty"`
	ObjectType                      string      `json:"objectType,omitempty"`
	TimeZone                        string      `json:"timeZone,omitempty"`
	FontSize                        json.Number `json:"fontSize,omitempty"`
	Image                           string      `json:"image,omitempty"`
	Source                          string      `json:"source,omitempty"`
	AudioSource                     string      `json:"audioSource,omitempty"`
	LinkUrl                         string      `json:"linkURL,omitempty"`
	ObjectAttrMatch                 string      `json:"objectAttrMatch,omitempty"`
	ObjectAttrNoMatch               string      `json:"objectAttrNoMatch,omitempty"`
	BoldText                        bool        `json:"boldText,omitempty"`
	Text                            string      `json:"text,omitempty"`
	ScrollPeriod                    string      `json:"scrollPeriod,omitempty"`
	BackgroundColor                 string      `json:"backgroundColor,omitempty"`
	FontColor                       string      `json:"fontColor,omitempty"`
	OkFontColor                     string      `json:"okFontColor,omitempty"`
	WarningFontColor                string      `json:"warningFontColor,omitempty"`
	WarningAcknowledgedFontColor    string      `json:"warningAcknowledgedFontColor,omitempty"`
	UnknownFontColor                string      `json:"unknownFontColor,omitempty"`
	UnknownAcknowledgedFontColor    string      `json:"unknownAcknowledgedFontColor,omitempty"`
	CriticalFontColor               string      `json:"criticalFontColor,omitempty"`
	CriticalAcknowledgedFontColor   string      `json:"criticalAcknowledgedFontColor,omitempty"`
	TextAlign                       string      `json:"textAlign,omitempty"`
	TextVerticalAlign               string      `json:"textVerticalAlign,omitempty"`
	OkSound                         string      `json:"okSound,omitempty"`
	WarningSound                    string      `json:"warningSound,omitempty"`
	UnknownSound                    string      `json:"unknownSound,omitempty"`
	CriticalSound                   string      `json:"criticalSound,omitempty"`
	UpSound                         string      `json:"upSound,omitempty"`
	DownSound                       string      `json:"downSound,omitempty"`
	StrokeWidth                     json.Number `json:"strokeWidth,omitempty"`
	RightArrow                      bool        `json:"rightArrow,omitempty"`
	LeftArrow                       bool        `json:"leftArrow,omitempty"`
	OkSvg                           string      `json:"okSvg,omitempty"`
	OkStrokeColor                   string      `json:"okStrokeColor,omitempty"`
	WarningSvg                      string      `json:"warningSvg,omitempty"`
	WarningStrokeColor              string      `json:"warningStrokeColor,omitempty"`
	WarningAcknowledgedStrokeColor  string      `json:"warningAcknowledgedStrokeColor,omitempty"`
	UnknownSvg                      string      `json:"unknownSvg,omitempty"`
	UnknownStrokeColor              string      `json:"unknownStrokeColor,omitempty"`
	UnknownAcknowledgedStrokeColor  string      `json:"unknownAcknowledgedStrokeColor,omitempty"`
	CriticalSvg                     string      `json:"criticalSvg,omitempty"`
	CriticalStrokeColor             string      `json:"criticalStrokeColor,omitempty"`
	CriticalAcknowledgedStrokeColor string      `json:"criticalAcknowledgedStrokeColor,omitempty"`
	StrokeColor                     string      `json:"strokeColor,omitempty"`
	Svg                             string      `json:"svg,omitempty"`
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
	dashboard.Order = Order{
		Critical:    0,
		CriticalAck: 1,
		Warning:     2,
		WarningAck:  3,
		Unknown:     4,
		UnknownAck:  5,
		Ok:          6,
	}
	if err := json.NewDecoder(f).Decode(&dashboard); err != nil {
		return Dashboard{}, fmt.Errorf("decode dashboard %s: %w", f.Name(), err)
	}
	dashboard.Slug = TitleToSlug(dashboard.Title)
	return dashboard, nil
}

// WriteDashboard writes the provided dashboard to the named file.
// The file is always truncated beforehand.
func WriteDashboard(name string, dashboard *Dashboard) error {
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
	return gitCommitFile(name, "Saving dashboard")
}

func getDashboardPaths(dashboardFile string) (string, string, error) {
   // Assuming the 'dashboards' directory is the Git root
   dashboardDirPath := filepath.Join(".", "dashboards")

   // Make sure the filePath is relative to the Git root
   absoluteFilePath, err := filepath.Abs(dashboardFile)
   if err != nil {
	   return "", "", fmt.Errorf("getting absolute file path: %v", err)
   }

   absoluteDashboardDirPath, err := filepath.Abs(dashboardDirPath)
   if err != nil {
	   return "", "", fmt.Errorf("getting absolute repo path: %v", err)
   }

   fileName, err := filepath.Rel(absoluteDashboardDirPath, absoluteFilePath)
   if err != nil {
	   return "", "", fmt.Errorf("converting to relative file path: %v", err)
   }

   return dashboardDirPath, fileName, nil 

}

func gitCommitFile(filePath, message string) error {
	dashboardDirPath, fileName, err := getDashboardPaths(filePath)
	if err != nil {
		return fmt.Errorf("Dashboard paths error: %v", err)
	}

    // Open the Git repository located at the 'dashboards' directory
    r, err := git.PlainOpen(dashboardDirPath)
    if err != nil {
        return fmt.Errorf("git open: %v", err)
    }

    // Get the worktree of the repository
    w, err := r.Worktree()
    if err != nil {
        return fmt.Errorf("git worktree: %v", err)
    }

    // Add the file to the staging area using the relative path
    _, err = w.Add(fileName)
    if err != nil {
        return fmt.Errorf("git add: %v", err)
    }

    // Commit the changes to the repository
    _, err = w.Commit(message, &git.CommitOptions{
        Author: &object.Signature{
            Name:  "Meerkat Application",
            Email: "meerkat@meerkat.run",
            When:  time.Now(),
        },
    })
    if err != nil {
        return fmt.Errorf("git commit: %v", err)
    }

    return nil
}

// gitListDashboardCommits lists the commits that have modified a specific file in a Git repository.
func gitListDashboardCommits(filePath string) ([]*object.Commit, error) {
	dashboardDirPath, fileName, err := getDashboardPaths(filePath)
	if err != nil {
		return nil, fmt.Errorf("Dashboard paths error: %v", err)
		
	}
	// Open the existing repository
	r, err := git.PlainOpen(dashboardDirPath)
	if err != nil {
		return nil, fmt.Errorf("error opening repository: %v", err)
	}

	// Log options to include the history of a specific file
	logOpts := &git.LogOptions{
		FileName: &filePath,
	}

	// Get the commit iterator
	iter, err := r.Log(logOpts)
	if err != nil {
		return nil, fmt.Errorf("error obtaining log: %v", err)
	}
	defer iter.Close()

	var commits []*object.Commit
	// Iterate through the commit logs
	for {
		commit, err := iter.Next()
		if err != nil {
			break // End of commit log
		}
		commits = append(commits, commit)
	}

	return commits, nil
}

// generateDiff generates a diff for a specific file between a specified commit and its parent.
func generateDiff(repoPath, commitHash, filePath string) (string, error) {
	gitRepo, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %v", err)
	}

	// Retrieve the specific commit
	commit, err := gitRepo.CommitObject(plumbing.NewHash(commitHash))
	if err != nil {
		return "", fmt.Errorf("failed to find commit: %v", err)
	}

	// Get the parent of the commit to diff with
	parent, err := commit.Parent(0)
	if err != nil {
		return "", fmt.Errorf("failed to find parent commit: %v", err)
	}

	// Get the trees from the commit and its parent
	parentTree, err := parent.Tree()
	if err != nil {
		return "", fmt.Errorf("failed to get parent tree: %v", err)
	}
	commitTree, err := commit.Tree()
	if err != nil {
		return "", fmt.Errorf("failed to get commit tree: %v", err)
	}

	// Compute the diff between the commit and its parent
	changes, err := object.DiffTree(parentTree, commitTree)
	if err != nil {
		return "", fmt.Errorf("failed to compute tree diff: %v", err)
	}

	// Find the specific change for the file
	for _, change := range changes {
		if change.From.Name == filePath || change.To.Name == filePath {
			patch, err := change.Patch()
			if err != nil {
				return "", fmt.Errorf("failed to generate patch: %v", err)
			}
			return patch.String(), nil
		}
	}

	return "", fmt.Errorf("no changes found for the file")
}

func TitleToSlug(title string) string {
	title = strings.ToLower(title)                // convert upper case to lower case
	title = strings.TrimSpace(title)              // remove preceeding and trailing whitespace
	dashSpaceMatch := regexp.MustCompile(`[_\s]`) // convert spaces and underscores to dashes
	title = dashSpaceMatch.ReplaceAllString(title, "-")
	unwantedMatch := regexp.MustCompile(`[^a-z0-9\-]`) // Remove any other characters
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
		case "critical":
			dashboard.Order.Critical, _ = strconv.Atoi(v)
		case "warning":
			dashboard.Order.Warning, _ = strconv.Atoi(v)
		case "unknown":
			dashboard.Order.Unknown, _ = strconv.Atoi(v)
		case "ok":
			dashboard.Order.Ok, _ = strconv.Atoi(v)
		case "critical_ack":
			dashboard.Order.CriticalAck, _ = strconv.Atoi(v)
		case "warning_ack":
			dashboard.Order.WarningAck, _ = strconv.Atoi(v)
		case "unknown_ack":
			dashboard.Order.UnknownAck, _ = strconv.Atoi(v)
		default:
			return Dashboard{}, fmt.Errorf("unknown form parameter %s", k)
		}
	}
	return dashboard, nil
}
