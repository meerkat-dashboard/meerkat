package main

import (
	"github.com/BurntSushi/toml"
)

type Config struct {
	HTTPAddr string

	IcingaURL         string
	IcingaUsername    string
	IcingaPassword    string
	IcingaInsecureTLS bool

	ServeTLS bool
	CRTPath  string
	KeyPath  string

	AdminUsername string
	AdminPassword string
}

const defaultConfigPath string = "/etc/meerkat.toml"

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

	return conf, err
}
