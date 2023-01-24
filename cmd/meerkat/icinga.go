package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/mailgun/groupcache/v2"
	"olowe.co/icinga"
)

type icingaAPIResults struct {
	Results []icingaAPIResult `json:"results"`
}

type icingaAPIResult struct {
	Attributes icingaAttributes `json:"attrs"`
	Name       string           `json:"name"`
	Type       string           `json:"type"`
}

type icingaAttributes struct {
	Acknowledgement float64  `json:"acknowledgement"`
	Name            string   `json:"name"`
	HostName        string   `json:"host_name"`
	DisplayName     string   `json:"display_name"`
	Command         string   `json:"check_command"`
	State           float32  `json:"state"`
	Interval        float32  `json:"check_interval"`
	Groups          []string `json:"groups"`
	Vars            vars     `json:"vars,omitempty"`
}

type vars struct{}

func (ir *icingaAPIResult) toIcingaObject() icingaObject {
	return icingaObject{
		ID:          ir.Name,
		Type:        ir.Type,
		Name:        ir.Attributes.Name,
		HostName:    ir.Attributes.HostName,
		DisplayName: ir.Attributes.DisplayName,
		Command:     ir.Attributes.Command,
		State:       ir.Attributes.State,
		Interval:    ir.Attributes.Interval,
		Groups:      ir.Attributes.Groups,
	}
}

type icingaObject struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	HostName    string   `json:"hostName"`
	DisplayName string   `json:"displayName"`
	Command     string   `json:"checkCommand"`
	State       float32  `json:"state"`
	Interval    float32  `json:"checkInterval"`
	Groups      []string `json:"groups"`
}

type icingaAPILastCheckResults struct {
	CheckResults []results `json:"results"`
}

type results struct {
	Attributes icingaCheckAttributes `json:"attrs"`
	Joins      joins                 `json:"joins,omitempty"`
	Meta       types                 `json:"meta,omitempty"`
	Name       string                `json:"name"`
	Type       string                `json:"type"`
}

type joins struct {
}

type types struct {
}

type icingaCheckAttributes struct {
	Attributes checkResult `json:"last_check_result"`
}

type checkResult struct {
	Active          bool       `json:"active"`
	CheckSource     string     `json:"check_source"`
	Command         []string   `json:"command"`
	ExecutionEnd    float64    `json:"execution_end"`
	ExecutionStart  float64    `json:"execution_start"`
	ExitStatus      float64    `json:"exit_status"`
	Output          string     `json:"output"`
	PerformanceData []string   `json:"performance_data"`
	ScheduleEnd     float64    `json:"schedule_end"`
	ScheduleStart   float64    `json:"schedule_start"`
	State           float64    `json:"state"`
	TTL             float64    `json:"ttl"`
	Type            string     `json:"type"`
	VarsAfter       varsAfter  `json:"vars_after"`
	VarsBefore      varsBefore `json:"vars_before"`
}

type varsAfter struct {
	Attempt   float64 `json:"attempt"`
	Reachable bool    `json:"reachable"`
	State     float64 `json:"state"`
	StateType float64 `json:"state_type"`
}

type varsBefore struct {
	Attempt   float64 `json:"attempt"`
	Reachable bool    `json:"reachable"`
	State     float64 `json:"state"`
	StateType float64 `json:"state_type"`
}

func handleCheckResult(w http.ResponseWriter, r *http.Request) {
	object := r.URL.Query().Get("object")
	attrs := r.URL.Query().Get("attrs")
	objType := r.URL.Query().Get("objtype")

	if object == "" {
		http.Error(w, "No unique queue name specified", http.StatusBadRequest)
		return
	}

	cache := groupcache.GetGroup("IcingaCheckResult")
	if cache == nil {
		log.Printf("No IcingaCheckResult cache")
		http.Error(w, "No cache available", http.StatusInternalServerError)
		return
	}

	var enc []byte
	key := strings.Join([]string{object, attrs, objType}, string(rune(0)))
	if err := cache.Get(r.Context(), key, groupcache.AllocatingByteSliceSink(&enc)); err != nil {
		log.Printf("Cache retrieval failed: %v", err)
		http.Error(w, "Cache retrieval failed", http.StatusInternalServerError)
		return
	}

	w.Write(enc)
}

func initIcingaCheckResultCache() {
	groupcache.NewGroup("IcingaCheckResult", config.CacheSizeBytes, groupcache.GetterFunc(
		func(ctx context.Context, key string, dest groupcache.Sink) error {
			bits := strings.SplitN(key, string(rune(0)), 3)

			if len(bits) < 3 {
				return fmt.Errorf("Invalid cache key")
			}

			object := bits[0]
			attrs := bits[1]
			objType := bits[2]

			client := &http.Client{}
			//Disable TLS verification if config says so
			if config.IcingaInsecureTLS {
				client.Transport = &http.Transport{
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				}
			}

			//Create HTTP request
			req_url, err := url.Parse(config.IcingaURL)
			if err != nil {
				log.Printf("Failed to parse IcingaURL: %v", err)
				return err
			}

			if objType == "service" {
				req_url.Path = path.Join(req_url.Path, "/v1/objects/services", object)
			} else {
				req_url.Path = path.Join(req_url.Path, "/v1/objects/hosts", object)
			}

			req_url.RawQuery = strings.ReplaceAll(url.Values{"attrs": []string{attrs}}.Encode(), "+", "%20")

			log.Printf("Proxying to icinga: GET %s", req_url.String())
			req, err := http.NewRequest("GET", req_url.String(), nil)
			req.Header.Set("Accept", "application/json")
			req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

			if err != nil {
				fmt.Println("Failed to create HTTP request:", err)
				return err
			}

			res, err := client.Do(req)
			if err != nil {
				fmt.Println("Icinga2 API error:", err)
				return err
			}

			defer res.Body.Close()

			var checkResults icingaAPILastCheckResults
			if err := json.NewDecoder(res.Body).Decode(&checkResults); err != nil {
				log.Printf("Error decoding Icinga2 API response: %v", err)
				return err
			}

			if enc, err := json.Marshal(checkResults); err != nil {
				log.Printf("Failed to encode IcingaCheckResult value: %v", err)
				return err
			} else {
				return dest.SetBytes(enc, time.Now().Add(time.Duration(config.CacheExpiryDurationSeconds)*time.Second))
			}
		},
	))
}

func handleIcingaCheckState(w http.ResponseWriter, r *http.Request) {
	object_type := r.URL.Query().Get("object_type")
	filter := r.URL.Query().Get("filter")

	if object_type == "" {
		http.Error(w, "No object type specified", http.StatusBadRequest)
		return
	}

	if filter == "" {
		http.Error(w, "No filter specified", http.StatusBadRequest)
		return
	}

	//We only support looking up hosts and services
	if object_type != "host" && object_type != "service" {
		http.Error(w, "Invalid object type", http.StatusBadRequest)
		return
	}

	cache := groupcache.GetGroup("IcingaCheckState")
	if cache == nil {
		log.Printf("No IcingaCheckState cache")
		http.Error(w, "No cache available", http.StatusInternalServerError)
		return
	}

	var enc []byte
	key := strings.Join([]string{object_type, filter}, string(rune(0)))
	if err := cache.Get(r.Context(), key, groupcache.AllocatingByteSliceSink(&enc)); err != nil {
		log.Printf("Cache retrieval failed: %v", err)
		http.Error(w, "Cache retrieval failed", http.StatusInternalServerError)
		return
	}
	w.Write(enc)
}

func initIcingaCheckStateCache() {
	groupcache.NewGroup("IcingaCheckState", config.CacheSizeBytes, groupcache.GetterFunc(
		func(ctx context.Context, key string, dest groupcache.Sink) error {
			bits := strings.SplitN(key, string(rune(0)), 2)

			if len(bits) < 2 {
				return fmt.Errorf("Invalid cache key")
			}

			object_type := bits[0]
			filter := bits[1]

			client, err := dialURL(config.IcingaURL, config.IcingaUsername, config.IcingaPassword, config.IcingaInsecureTLS)
			if err != nil {
				return fmt.Errorf("dial icinga: %v", err)
			}

			var worst together
			switch object_type {
			case "host":
				var hosts []icinga.Host
				hosts, err = client.Hosts(filter)
				worst = worstHost(hosts)
			case "service":
				var services []icinga.Service
				services, err = client.Services(filter)
				worst = worstService(services)
			default:
				return fmt.Errorf("cannot lookup state for object type %s", object_type)
			}
			if err != nil {
				return fmt.Errorf("search objects: %w", err)
			}

			buf, err := json.Marshal(&worst)
			if err != nil {
				return err
			}
			dur := time.Duration(config.CacheExpiryDurationSeconds) * time.Second
			expiry := time.Now().Add(dur)
			return dest.SetBytes(buf, expiry)
		},
	))
}

func handleIcingaCheck(w http.ResponseWriter, r *http.Request) {
	checkType := chi.URLParam(r, "check-type")
	objectID := chi.URLParam(r, "object-id")
	filter := r.URL.Query().Get("filter")

	//We only support looking up hosts and services
	if checkType != "hosts" && checkType != "services" && checkType != "hostgroups" && checkType != "servicegroups" {
		http.Error(w, "Endpoint must be 'hosts' or 'services'", http.StatusBadRequest)
		return
	}

	cache := groupcache.GetGroup("IcingaCheck")
	if cache == nil {
		log.Printf("No IcingaCheck cache")
		http.Error(w, "No cache available", http.StatusInternalServerError)
		return
	}

	var enc []byte
	key := strings.Join([]string{checkType, objectID, filter}, string(rune(0)))
	if err := cache.Get(r.Context(), key, groupcache.AllocatingByteSliceSink(&enc)); err != nil {
		log.Printf("Cache retrieval failed: %v", err)
		http.Error(w, "Cache retrieval failed", http.StatusInternalServerError)
		return
	}

	w.Write(enc)
}

func initIcingaCheckCache() {
	groupcache.NewGroup("IcingaCheck", config.CacheSizeBytes, groupcache.GetterFunc(
		func(ctx context.Context, key string, dest groupcache.Sink) error {
			bits := strings.SplitN(key, string(rune(0)), 3)

			if len(bits) < 3 {
				return fmt.Errorf("Invalid cache key")
			}

			checkType := bits[0]
			objectID := bits[1]
			filter := bits[2]

			client := &http.Client{}
			//Disable TLS verification if config says so
			if config.IcingaInsecureTLS {
				client.Transport = &http.Transport{
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				}
			}

			//Create HTTP request
			req_url, err := url.Parse(config.IcingaURL)
			if err != nil {
				log.Printf("Failed to parse IcingaURL: %v", err)
				return err
			}

			req_url.Path = path.Join(req_url.Path, "/v1/objects", checkType)
			if objectID != "" {
				req_url.Path = path.Join(req_url.Path, objectID)
			}

			if filter != "" {
				req_url.RawQuery = strings.ReplaceAll(url.Values{"filter": []string{filter}}.Encode(), "+", "%20")
			}

			log.Printf("Requesting %s", req_url.String())
			req, err := http.NewRequest("GET", req_url.String(), nil)
			if err != nil {
				log.Printf("Failed to create HTTP request: %v", err)
				return err
			}

			req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

			//Make request
			res, err := client.Do(req)
			if err != nil {
				log.Printf("Icinga2 API error: %v", err.Error())
				return err
			}
			defer res.Body.Close()

			var results icingaAPIResults
			dec := json.NewDecoder(res.Body)
			err = dec.Decode(&results)
			if err != nil {
				log.Printf("Error decoding Icinga2 API response: %v", err)
				return err
			}

			//Convert to our type
			var objs []icingaObject
			for _, check := range results.Results {
				objs = append(objs, check.toIcingaObject())
			}

			if enc, err := json.Marshal(objs); err != nil {
				log.Printf("Failed to encode IcingaCheck value: %v", err)
				return err
			} else {
				return dest.SetBytes(enc, time.Now().Add(time.Duration(config.CacheExpiryDurationSeconds)*time.Second))
			}
		},
	))
}

func initialiseIcingaCaches() {
	initIcingaCheckResultCache()
	initIcingaCheckStateCache()
	initIcingaCheckCache()
}
