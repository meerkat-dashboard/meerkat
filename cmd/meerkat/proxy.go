package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/meerkat-dashboard/meerkat/proxy"
)

// Icinga's default duration between check commands is 60 seconds.
const DefaultCacheDuration = 60 * time.Second

func NewCachingProxy(icinga *httputil.ReverseProxy, ttl time.Duration) *proxy.Proxy {
	proxy := &proxy.Proxy{
		Next: icinga,
	}
	icinga.ModifyResponse = proxy.StoreOKResponse(ttl)
	return proxy
}

func setMaxAge(dur time.Duration, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodGet && req.Method != http.MethodHead {
			next.ServeHTTP(w, req)
			return
		}
		seconds := int(dur.Seconds())
		w.Header().Set("Cache-Control", fmt.Sprintf("max-age=%d", seconds))
		next.ServeHTTP(w, req)
	})
}

func NewIcingaProxy(target *url.URL, username, password string, insecureSkipVerify bool) *httputil.ReverseProxy {
	px := httputil.NewSingleHostReverseProxy(target)
	if insecureSkipVerify {
		t := *http.DefaultTransport.(*http.Transport)
		t.TLSClientConfig = &tls.Config{InsecureSkipVerify: insecureSkipVerify}
		px.Transport = &t
	}
	defaultDirector := px.Director
	px.Director = func(req *http.Request) {
		req.SetBasicAuth(username, password)
		defaultDirector(req)
	}
	return px
}
