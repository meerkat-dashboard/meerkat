package meerkat

import (
	"fmt"
	"os"
	"runtime/debug"
	"strings"
)

func BuildString() string {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		return "no build information"
	}
	var revision, time string
	var dirty bool
	for _, setting := range info.Settings {
		switch k := setting.Key; k {
		case "vcs.revision":
			revision = setting.Value
		case "vcs.time":
			time = setting.Value
		case "vcs.modified":
			if setting.Value == "true" {
				dirty = true
			}
		}
	}
	s := fmt.Sprintf("%s revision %.8s on %s", info.Main.Path, revision, time)
	if dirty {
		s += " (dirty)"
	}
	return s
}

func VersionString() string {
	bytes, err := os.ReadFile("VERSION")
	dev := "development"

	if err != nil {
		return dev
	}

	version := strings.Split(string(bytes), "\n")[0]
	if len(version) == 0 {
		return dev
	}

	return version
}
