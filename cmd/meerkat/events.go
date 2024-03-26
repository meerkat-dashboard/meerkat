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
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/r3labs/sse/v2"
)

type AcknowledgementSet struct {
	Host    string
	Service string
	Author  string
	Comment string
	Notify  bool
	Expiry  float64
}

type AcknowledgementCleared struct {
	Host    string
	Service string
}

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

// Returns the priority of a results state based on the dashboard severity order configuration.
func getPriority(result Result, dashboard Dashboard) int {
	switch result.Attrs.State {
	case 2: // CRITICAL
		if result.Attrs.Acknowledgement == 0 {
			return dashboard.Order.Critical
		} else {
			return dashboard.Order.CriticalAck
		}
	case 3: // UNKNOWN
		if result.Attrs.Acknowledgement == 0 {
			return dashboard.Order.Unknown
		} else {
			return dashboard.Order.UnknownAck
		}
	case 1: // WARNING
		if result.Attrs.Acknowledgement == 0 {
			return dashboard.Order.Warning
		} else {
			return dashboard.Order.WarningAck
		}
	case 0: // OK
		return dashboard.Order.Ok
	}
	return 1000
}

func (r Result) isWorse(result Result, dashboard Dashboard) bool {
	return getPriority(r, dashboard) < getPriority(result, dashboard)
}

/*
This function is used to handle the event stream from Icinga.
When an event is received compare the event with the objects in an element to get the worst result.
If the worst result is worse than the last event, update the last event and send the event to the dashboard.
*/
func handleKey(dashboard Dashboard, elementList []ElementStore, name string, event Event) {
	for i, element := range elementList {
		if (element.Type == "host" && event.Service != "") || (element.Type == "service" && event.Service == "") {
			continue
		}

		results := make([]Result, 0, len(element.Objects))
		found := false
		var worstObject Result
		for _, objectName := range element.Objects {
			if objectName == name {
				found = true
				req := eventToRequest(event, name, element.Type, element.Name)

				if worstObject == (Result{}) {
					worstObject = req
				} else if req.isWorse(worstObject, dashboard) {
					worstObject = req
				}

				results = []Result{worstObject}
				cache.Set(objectName, req, 1)
				cache.Wait()
			} else {
				value, ok := cache.Get(objectName)
				if ok {
					cachedObject := value.(Result)
					cachedObject.Element = element.Name
					if worstObject == (Result{}) {
						worstObject = cachedObject
					} else if cachedObject.isWorse(worstObject, dashboard) {
						worstObject = cachedObject
					}
					results = []Result{worstObject}
				}
			}
		}

		// Prevents duplicate events being sent
		if event.Type == "CheckResult" {
			if worstObject.Attrs.Acknowledgement == element.LastEvent.Attrs.Acknowledgement {
				if worstObject.Attrs.Name == element.LastEvent.Attrs.Name {
					if worstObject.Attrs.State == element.LastEvent.Attrs.State {
						if reflect.DeepEqual(worstObject.Attrs.LastCheckResults.PerformanceData, element.LastEvent.Attrs.LastCheckResults.PerformanceData) {
							return
						}
					}
				}
			}
		}

		if found && worstObject != (Result{}) {
			body, err := json.Marshal(results)
			if err != nil {
				log.Println(err)
				return
			}
			mapLock.Lock()
			dashboardCache[dashboard.Slug][i].LastEvent = worstObject
			mapLock.Unlock()
			server.Publish(dashboard.Slug, &sse.Event{
				Event: []byte(event.Type),
				Data:  []byte(body),
			})
		}
	}
}

// This function is used to handle the AcknowledgementSet and AcknowledgementCleared events from Icinga.
func handleAcknowledge(dashboard Dashboard, elementList []ElementStore, name string, acknowledged int) {
	for i, element := range elementList {
		value, ok := cache.Get(name)
		if ok {
			req := value.(Result)
			req.Attrs.Acknowledgement = acknowledged

			if element.LastEvent.Name == name {
				element.LastEvent.Attrs.Acknowledgement = acknowledged
				mapLock.Lock()
				dashboardCache[dashboard.Slug][i].LastEvent = element.LastEvent
				mapLock.Unlock()

				results := []Result{element.LastEvent}
				body, err := json.Marshal(results)
				if err != nil {
					log.Println(err)
					return
				}

				server.Publish(dashboard.Slug, &sse.Event{
					Event: []byte("StateChange"),
					Data:  []byte(body),
				})

				server.Publish(dashboard.Slug, &sse.Event{
					Event: []byte("CheckResult"),
					Data:  []byte(body),
				})
			}

			cache.Set(name, req, 1)
		}
	}
}

// This function is used to handle the event stream from Icinga.
func handleEvent(response string) error {
	var name string
	var event Event
	var eventType int
	var acknowledgement int
	if strings.Contains(response, "AcknowledgementSet") {
		eventType = 1
		acknowledgement = 1
		var ack AcknowledgementSet
		err := json.Unmarshal([]byte(response), &ack)
		if err != nil {
			return err
		}

		name = ack.Host
		if ack.Service != "" {
			name = name + "!" + ack.Service
		}

		value, ok := cache.Get(name)
		if ok {
			req := value.(Result)
			req.Attrs.Acknowledgement = 1
			cache.Set(name, req, 1)
			cache.Wait()
		}
	} else if strings.Contains(response, "AcknowledgementCleared") {
		eventType = 1
		acknowledgement = 0
		var ack AcknowledgementCleared
		err := json.Unmarshal([]byte(response), &ack)
		if err != nil {
			return err
		}

		name = ack.Host
		if ack.Service != "" {
			name = name + "!" + ack.Service
		}

		value, ok := cache.Get(name)
		if ok {
			req := value.(Result)
			req.Attrs.Acknowledgement = 0
			cache.Set(name, req, 1)
			cache.Wait()
		}
	} else {
		eventType = 0
		err := json.Unmarshal([]byte(response), &event)
		if err != nil {
			return err
		}
		name = event.Host

		if event.Service != "" {
			name = name + "!" + event.Service
		}
	}
	mapLock.RLock()
	dashboardCacheCopy := dashboardCache
	mapLock.RUnlock()

	var wg sync.WaitGroup

	dashboardSync.Range(func(key, value interface{}) bool {
		dashboard := value.(Dashboard)
		if len(dashboard.CurrentlyOpenBy) > 0 {
			wg.Add(1)
			go func(dashboard Dashboard, elementList []ElementStore) {
				defer wg.Done()
				if eventType == 0 {
					handleKey(dashboard, elementList, name, event)
				} else {
					handleAcknowledge(dashboard, elementList, name, acknowledgement)
				}
			}(dashboard, dashboardCacheCopy[dashboard.Slug])
		}
		return true
	})

	wg.Wait()

	if eventType == 0 {
		addEvent(name, event.Type)
	}

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

	var requestBody = []byte(`{ "types": [ "CheckResult", "StateChange", "AcknowledgementSet", "AcknowledgementCleared" ], "queue": "meerkat", "filter": ""}`)

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
	status.Backends.Icinga.Connections.EventStreams.LastEventReceived = int(time.Now().UnixMilli())
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
				dashboard, ok := dashboardSync.Load(stream)
				if ok {
					d := dashboard.(Dashboard)
					d.CurrentlyOpenBy = append(d.CurrentlyOpenBy, r.RemoteAddr)
					dashboardSync.Store(stream, d)
				}

				<-r.Context().Done()

				dashboard, ok = dashboardSync.Load(stream)
				if ok {
					d := dashboard.(Dashboard)
					for i, v := range d.CurrentlyOpenBy {
						if v == r.RemoteAddr {
							d.CurrentlyOpenBy = append(d.CurrentlyOpenBy[:i], d.CurrentlyOpenBy[i+1:]...)
							dashboardSync.Store(stream, d)
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
