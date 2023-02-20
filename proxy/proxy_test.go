package proxy

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"testing"
	"time"
)

func serveTime(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, time.Now().UnixNano())
}

func TestProxy(t *testing.T) {
	origin := httptest.NewServer(http.HandlerFunc(serveTime))
	defer origin.Close()
	u, err := url.Parse(origin.URL)
	if err != nil {
		t.Fatal(err)
	}
	cache := &Proxy{}
	rproxy := httputil.NewSingleHostReverseProxy(u)
	rproxy.ModifyResponse = cache.StoreOKResponse(10 * time.Second)
	cache.Next = rproxy

	frontend := httptest.NewServer(cache)

	resp, err := http.Get(frontend.URL)
	if err != nil {
		t.Fatal(err)
	}
	buf := &bytes.Buffer{}
	io.Copy(buf, resp.Body)
	resp.Body.Close()
	then := buf.String()

	// now := time.Now().Unix()
	resp, err = http.Get(frontend.URL)
	if err != nil {
		t.Fatal(err)
	}
	buf.Reset()
	io.Copy(buf, resp.Body)
	resp.Body.Close()
	got := buf.String()
	if got != then {
		t.Errorf("wanted cached response %s, got %s", then, got)
	}
}
