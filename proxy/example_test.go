package proxy_test

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/meerkat-dashboard/meerkat/proxy"
)

func ExampleProxy() {
	u, err := url.Parse("http://www.example.com")
	if err != nil {
		// ...
	}
	// revproxy handles requests to example.com
	revproxy := httputil.NewSingleHostReverseProxy(u)

	// Create a proxy.
	srv := &proxy.Proxy{}

	// Set the Next handler so that when our proxy receives a
	// request it has no cached response to, it will pass the request
	// onwards.
	srv.Next = revproxy

	// Finally, configure the reverse proxy to copy response bodies into our cache.
	// Responses are considered fresh for 30 seconds.
	revproxy.ModifyResponse = srv.StoreOKResponse(30 * time.Second)

	http.Handle("/", srv)
	http.ListenAndServe(":8080", nil)
}
