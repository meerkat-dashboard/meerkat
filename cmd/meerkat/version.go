package main

import (
	"fmt"
	"io"
	"runtime/debug"
)

func printVersionString(w io.Writer) {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		fmt.Fprintln(w, "no build information")
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
	fmt.Fprintln(w, s)
}
