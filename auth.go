package main

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"time"
)

const cookieName string = "meerkat"

type tokenStore map[token]time.Time

func (store tokenStore) authenticate(tok string) (success bool) {
	for k := range store {
		if token(tok) == k {
			return true
		}
	}
	return false
}

func newTokenStore() tokenStore {
	return make(map[token]time.Time)
}

type token string

func newToken() (token, error) {
	s, err := randomString(32)
	if err != nil {
		return "", err
	}
	return token(s), nil
}

func randomString(n int) (string, error) {
	buf := &bytes.Buffer{}
	encoder := base64.NewEncoder(base64.StdEncoding, buf)
	b, err := randomBytes(n)
	if err != nil {
		return "", err
	}
	encoder.Write(b)
	encoder.Close()
	return buf.String(), nil
}

func randomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// basicAuthHandler returns a http.Handler which presents a HTTP Basic Authentication challenge
// before the request can proceed. The challenge must be completed with the provided
// username and password.
// Alternatively, a Cookie may be sent containing a token from a previous successful authentication.
// On successful authentication, a Cookie is returned and the request is handled by next.
func basicAuthHandler(username, password string, store tokenStore, next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, req *http.Request) {
		cookie, err := req.Cookie(cookieName)
		if errors.Is(err, http.ErrNoCookie) {
			// continue to basic auth
		} else if err != nil {
			code := http.StatusBadRequest
			http.Error(w, http.StatusText(code), code)
			return
		}
		if cookie != nil {
			if store.authenticate(cookie.Value) {
				next.ServeHTTP(w, req)
				return
			}
		}

		u, p, ok := req.BasicAuth()
		if !ok || len(u) == 0 || len(p) == 0 {
			w.Header().Set("WWW-Authenticate", `Basic realm="meerkat"`)
			c := http.StatusUnauthorized
			http.Error(w, http.StatusText(c), c)
			return
		}
		if u == username && p == password {
			token, err := newToken()
			if err != nil {
				msg := fmt.Sprintf("create new auth token: %v", err)
				http.Error(w, msg, http.StatusInternalServerError)
				return
			}
			store[token] = time.Now()
			cookie := &http.Cookie{
				Name:  cookieName,
				Value: string(token),
			}
			http.SetCookie(w, cookie)

			next.ServeHTTP(w, req)
			return
		}
		w.Header().Set("WWW-Authenticate", `Basic realm="meerkat"`)
		c := http.StatusUnauthorized
		http.Error(w, http.StatusText(c), c)
	}
	return http.HandlerFunc(fn)
}

func emptyHandler(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
