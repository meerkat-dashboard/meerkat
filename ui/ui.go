// package ui provides the Meerkat GUI web application.
// Interactive parts of the interface are managed by [preact];
// the rest is static HTML rendered by the html/template package.
//
// [preact]: https://preactjs.com/
package ui

import (
	"embed"
	"io/fs"
)

// A Server serves the Meerkat GUI web application.
// It must be created with NewServer.
type Server struct {
	fsys fs.FS
}

//go:embed template dist
var content embed.FS

// NewServer returns a Server which serves its contents from fsys.
// fsys may be nil, in which case the returned Server serves the UI
// from an embedded filesystem created at build time.
func NewServer(fsys fs.FS) *Server {
	if fsys == nil {
		return &Server{content}
	}
	return &Server{fsys}
}
