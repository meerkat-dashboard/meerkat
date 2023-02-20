// Package proxy provides a caching http.Handler implementation.
// It is intended to be used in a low-configuration reverse proxy via
// httputil.ReverseProxy,
// with the caveat that responses are cached by request URL.
// This makes the proxy only suitable for fronting REST-like API services.
//
// For a more general-purpose cache, consider nginx or varnish.
//
// The recommended usage is to combine this package with httputil.ReverseProxy.
// For an example, see ExampleProxy().
package proxy

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

func serviceUnavailable(w http.ResponseWriter, req *http.Request) {
	http.Error(w, http.StatusText(http.StatusServiceUnavailable), http.StatusServiceUnavailable)
}

// A Proxy is a http.Handler which intercepts requests to an upstream http.Handler.
// If the Proxy has a fresh response to a request in its cache,
// Proxy handles the request directly.
// Otherwise, the request is handled by the upstream handler.
// A zero-value Proxy is ready for use.
//
// Response bodies from a handler may be cached by using a
// httputil.ReverseProxy as the handler.
// The reverse proxy should be configured with Proxy.StoreOKResponse.
// See ExampleProxy for recommended usage.
type Proxy struct {
	// Cache holds the responses to be served by Proxy. If Cache
	// is nil, a new Cache is initialised with a scan interval of 1
	// second.
	*Cache
	// Next handles requests for which the Proxy has no fresh
	// response.
	Next http.Handler
	// TTL is the duration that a response from Next should
	// be considered fresh. If zero, a default value of 5 seconds is
	// used.
	TTL         time.Duration
	initialised bool
	stats       *stats
}

type stats struct {
	hit  int
	miss int
}

func (p *Proxy) initUnsetWithDefault() {
	if p.Cache == nil {
		p.Cache = NewCache(time.Second)
	}
	if p.Next == nil {
		p.Next = http.HandlerFunc(serviceUnavailable)
	}
	if p.TTL == 0 {
		p.TTL = 5 * time.Second
	}
	if p.stats == nil {
		p.stats = &stats{}
	}
	p.initialised = true
}

func (p *Proxy) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if !p.initialised {
		p.initUnsetWithDefault()
	}

	if b, ok := p.Load(req.URL.String()); ok {
		p.stats.hit++
		w.Write(b)
		return
	}
	log.Println("cache miss", req.URL)
	p.stats.miss++
	p.Next.ServeHTTP(w, req)
}

// StoreOKResponse returns a function which stores responses bodies in the proxy cache.
// Each entry is considered fresh for the given duration.
// Only responses to GET and HEAD requests with a HTTP OK status are stored.
//
// StoreResponse is intended to be used in httputil.ReverseProxy.ModifyResponse.
func (p *Proxy) StoreOKResponse(ttl time.Duration) func(*http.Response) error {
	return func(resp *http.Response) error {
		if !p.initialised {
			p.initUnsetWithDefault()
		}

		if resp.Request == nil {
			return fmt.Errorf("store response: no matching request")
		}
		// only store responses which are safe to cache
		if resp.StatusCode != http.StatusOK {
			return nil
		} else if resp.Request.Method != http.MethodGet && resp.Request.Method != http.MethodHead {
			return nil
		}

		buf := &bytes.Buffer{}
		defer resp.Body.Close()
		_, err := io.Copy(buf, resp.Body)
		if err != nil {
			return fmt.Errorf("store response: read body: %v", err)
		}
		p.Store(resp.Request.URL.RequestURI(), buf.Bytes(), ttl)
		resp.Body = io.NopCloser(buf)
		return nil
	}
}

func (p *Proxy) serveStats(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintln(w, p.stats)
}
