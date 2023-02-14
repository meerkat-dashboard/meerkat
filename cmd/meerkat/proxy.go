package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

// Icinga's default duration between check commands is 60 seconds.
const DefaultCacheDuration = 60 * time.Second

func setCacheControl(dur time.Duration) func(*http.Response) error {
	seconds := int(dur.Seconds())
	return func(resp *http.Response) error {
		resp.Header.Set("Cache-Control", fmt.Sprintf("max-age=%d", seconds))
		return nil
	}
}

func NewIcingaProxy(target *url.URL, username, password string, insecureSkipVerify bool) *httputil.ReverseProxy {
	proxy := httputil.NewSingleHostReverseProxy(target)
	if insecureSkipVerify {
		t := http.DefaultTransport.(*http.Transport)
		t.TLSClientConfig = &tls.Config{InsecureSkipVerify: insecureSkipVerify}
		proxy.Transport = t
	}
	defaultDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		req.SetBasicAuth(username, password)
		defaultDirector(req)
	}
	proxy.ModifyResponse = setCacheControl(DefaultCacheDuration)
	return proxy
}
