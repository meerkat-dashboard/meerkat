package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/url"

	"github.com/BurntSushi/toml"
	"olowe.co/icinga"
)

type Config struct {
	HTTPAddr string

	IcingaURL         string
	IcingaUsername    string
	IcingaPassword    string
	IcingaInsecureTLS bool

	AdminUsername string
	AdminPassword string

	CacheExpiryDurationSeconds int64
	CacheSizeBytes             int64
}

func LoadConfig(name string) (Config, error) {
	var conf Config
	var err error
	if name != "" {
		_, err = toml.DecodeFile(name, &conf)
	}

	if conf.HTTPAddr == "" {
		conf.HTTPAddr = ":8080"
	}

	if conf.IcingaURL == "" {
		conf.IcingaURL = "https://127.0.0.1:5665"
	}
	if conf.IcingaUsername == "" {
		conf.IcingaUsername = "meerkat"
	}
	if conf.IcingaPassword == "" {
		conf.IcingaPassword = "meerkat"
	}

	if config.CacheExpiryDurationSeconds == 0 {
		config.CacheExpiryDurationSeconds = 16
	}
	if config.CacheSizeBytes == 0 {
		config.CacheSizeBytes = 20971520
	}

	return conf, err
}

func dialURL(link, username, password string, skipVerify bool) (*icinga.Client, error) {
	u, err := url.Parse(link)
	if err != nil {
		return nil, fmt.Errorf("parse icinga URL: %w", err)
	}

	hClient := http.DefaultClient
	if skipVerify {
		t := http.DefaultTransport.(*http.Transport)
		t.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
		hClient.Transport = t
	}
	return icinga.Dial(u.Host, username, password, hClient)
}
