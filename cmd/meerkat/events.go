package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/r3labs/sse/v2"
)

type Event struct {
	Acknowledgement bool        `json:"acknowledgement,omitempty"`
	CheckResult     CheckResult `json:"check_result,omitempty"`
	DowntimeDepth   int         `json:"downtime_depth,omitempty"`
	Host            string      `json:"host,omitempty"`
	Service         string      `json:"service,omitempty"`
	Timestamp       float64     `json:"timestamp,omitempty"`
	Type            string      `json:"type,omitempty"`
}

type CheckResult struct {
	Active            bool        `json:"active,omitempty"`
	CheckSource       string      `json:"check_source,omitempty"`
	Command           interface{} `json:"command,omitempty"`
	ExecutionEnd      float64     `json:"execution_end,omitempty"`
	ExecutionStart    float64     `json:"execution_start,omitempty"`
	ExitStatus        json.Number `json:"exit_status,omitempty"`
	Output            string      `json:"output,omitempty"`
	PerformanceData   interface{} `json:"performance_data,omitempty"`
	PreviousHardState int         `json:"previous_hard_state,omitempty"`
	ScheduleEnd       float64     `json:"schedule_end,omitempty"`
	ScheduleStart     float64     `json:"schedule_start,omitempty"`
	SchedulingSource  string      `json:"scheduling_source,omitempty"`
	State             int         `json:"state,omitempty"`
	TTL               int         `json:"ttl,omitempty"`
	Type              string      `json:"type,omitempty"`
	VarsAfter         *struct {
		Attempt   json.Number `json:"attempt,omitempty"`
		Reachable bool        `json:"reachable,omitempty"`
		State     int         `json:"state,omitempty"`
		StateType int         `json:"state_type,omitempty"`
	} `json:"vars_after,omitempty"`
	VarsBefore *struct {
		Attempt   json.Number `json:"attempt,omitempty"`
		Reachable bool        `json:"reachable,omitempty"`
		State     int         `json:"state,omitempty"`
		StateType int         `json:"state_type,omitempty"`
	} `json:"vars_before,omitempty"`
}

func handleKey(slug string, elementList []ElementStore, name string, event Event) {
	for _, element := range elementList {
		results := make([]Result, 0, len(element.Objects))
		found := false

		var worstObject Result
		for _, objectName := range element.Objects {
			if objectName == name {
				found = true
				req := eventToRequest(event, name, element.Type)

				if worstObject == (Result{}) {
					worstObject = req
				} else {
					if req.Attrs.State > worstObject.Attrs.State {
						worstObject = req
					}
				}

				results = []Result{worstObject}
				cache.Set(objectName, req, 1)
				cache.Wait()
			} else {
				value, ok := cache.Get(objectName)
				if ok {
					cachedObject := value.(Result)
					if worstObject == (Result{}) {
						worstObject = cachedObject
					} else {
						if cachedObject.Attrs.State > worstObject.Attrs.State {
							worstObject = cachedObject
						}
					}
					results = []Result{worstObject}
				}
			}
		}
		if found {
			body, err := json.Marshal(results)
			if err != nil {
				log.Println(err)
				return
			}

			server.Publish(slug, &sse.Event{
				Event: []byte(event.Type),
				Data:  []byte(body),
			})
			// fmt.Println("Publish Event:", event.Type, name, slug, string(body))
		}
	}
}

func handleEvent(response string) error {
	var event Event
	err := json.Unmarshal([]byte(response), &event)
	if err != nil {
		return err
	}
	name := event.Host

	if event.Service != "" {
		name = name + "!" + event.Service
	}

	mapLock.RLock()
	dashboardCacheCopy := dashboardCache
	mapLock.RUnlock()

	var wg sync.WaitGroup

	for _, dashboard := range status.Meerkat.Dashboards {
		if len(dashboard.CurrentlyOpenBy) > 0 {
			wg.Add(1)
			go func(slug string, elementList []ElementStore) {
				defer wg.Done()
				handleKey(slug, elementList, name, event)
			}(dashboard.Slug, dashboardCacheCopy[dashboard.Slug])
		}
	}

	wg.Wait()

	status.Backends.Icinga.Connections.EventStreams.LastEventReceived = int(time.Now().UnixMilli())
	addEvent(name, event.Type)
	return nil
}

func EventListener() {
	log.Println("Subscribing to event streams")

	client := &http.Client{
		Transport: &http.Transport{
			Dial: (&net.Dialer{
				Timeout:   time.Second * 5,
				KeepAlive: time.Second * 30,
			}).Dial,
			TLSHandshakeTimeout: time.Second * 5,
			TLSClientConfig:     &tls.Config{InsecureSkipVerify: config.IcingaInsecureTLS},
		},
	}

	var requestBody = []byte(`{ "types": [ "CheckResult", "StateChange" ], "queue": "meerkat", "filter": ""}`)

	req, err := http.NewRequest("POST", config.IcingaURL+"/v1/events", bytes.NewBuffer(requestBody))
	if err != nil {
		log.Println("Error creating events request:", err)
		return
	}
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error sending events request:", err)
		return
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)

	ctx, cancel := context.WithCancel(context.Background())
	timer := time.NewTimer(time.Duration(config.IcingaEventTimeout) * time.Second)
	events := make(chan string)

	go func() {
		for {
			select {
			case <-ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
				log.Printf("Event stream timed out\n")
				SendError()
				cancel()
			}
		}
	}()

	go func() {
		for {
			line, err := reader.ReadBytes('\n')
			if err != nil {
				log.Println("Error reading event stream:", err)
				cancel()
			}
			if !timer.Stop() {
				<-timer.C
			}
			timer.Reset(time.Duration(config.IcingaEventTimeout) * time.Second)

			events <- string(line)
		}
	}()
Loop:
	for {
		select {
		case <-ctx.Done():
			log.Println("Event stream closed")
			break Loop
		case event := <-events:
			err = handleEvent(event)
			if err != nil {
				log.Println("Error decoding event:", err, event)
				cancel()
				break Loop
			}
		case <-time.After(time.Duration(config.IcingaEventTimeout) * time.Second):
			log.Println("Event stream timed out.")
			break Loop
		}
	}

	log.Println("Event stream connection was closed")
}

type Events struct {
	Name         string `json:"name"`
	EventType    string `json:"type"`
	ReceivedTime int64  `json:"received_time"`
}

type EventList struct {
	sync.RWMutex
	events []Events
}

func addEvent(event string, eventType string) {
	eventList.Lock()
	defer eventList.Unlock()
	eventList.events = append(eventList.events, Events{Name: event, EventType: eventType, ReceivedTime: time.Now().UnixMilli()})
}

func getEvents() []Events {
	eventList.RLock()
	defer eventList.RUnlock()
	values := make([]Events, len(eventList.events))
	copy(values, eventList.events)
	return values
}

func createEventStream(r *chi.Mux) {
	r.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		go func() {
			stream := r.URL.Query().Get("stream")
			if stream != "update" {
				var index int
				for dashboard := range status.Meerkat.Dashboards {
					if status.Meerkat.Dashboards[dashboard].Slug == stream {
						index = dashboard
						status.Meerkat.Dashboards[dashboard].CurrentlyOpenBy = append(status.Meerkat.Dashboards[dashboard].CurrentlyOpenBy, r.RemoteAddr)
					}
				}
				<-r.Context().Done()
				if status.Meerkat.Dashboards[index].Slug == stream {
					for i, v := range status.Meerkat.Dashboards[index].CurrentlyOpenBy {
						if v == r.RemoteAddr {
							status.Meerkat.Dashboards[index].CurrentlyOpenBy = append(status.Meerkat.Dashboards[index].CurrentlyOpenBy[:i], status.Meerkat.Dashboards[index].CurrentlyOpenBy[i+1:]...)
							break
						}
					}
				}
			} else {
				<-r.Context().Done()
			}
		}()

		server.ServeHTTP(w, r)
	})
}
