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

func handleKey(dashboard Dashboard, elementList []ElementStore, name string, event Event) {
	for i, element := range elementList {
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

		if found && (worstObject.Attrs.Name != element.LastEvent || name == element.LastEvent) && worstObject != (Result{}) {
			body, err := json.Marshal(results)
			if err != nil {
				log.Println(err)
				return
			}
			mapLock.Lock()
			dashboardCache[dashboard.Slug][i].LastEvent = worstObject.Name
			mapLock.Unlock()
			server.Publish(dashboard.Slug, &sse.Event{
				Event: []byte(event.Type),
				Data:  []byte(body),
			})
			//fmt.Println("Publish Event:", event.Type, name, worstObject.Name, slug, string(body))
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
	dashboardLock.RLock()
	dashboardListCopy := status.Meerkat.Dashboards
	dashboardLock.RUnlock()

	for _, dashboard := range dashboardListCopy {
		if len(dashboard.CurrentlyOpenBy) > 0 {
			wg.Add(1)
			go func(dashboard Dashboard, elementList []ElementStore) {
				defer wg.Done()
				handleKey(dashboard, elementList, name, event)
			}(dashboard, dashboardCacheCopy[dashboard.Slug])
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
				dashboardLock.Lock()
				dashboard, ok := status.Meerkat.Dashboards[stream]
				if ok {
					dashboard.CurrentlyOpenBy = append(dashboard.CurrentlyOpenBy, r.RemoteAddr)
					status.Meerkat.Dashboards[stream] = dashboard
				}
				dashboardLock.Unlock()

				<-r.Context().Done()

				dashboardLock.Lock()
				dashboard, ok = status.Meerkat.Dashboards[stream]
				if ok {
					for i, v := range dashboard.CurrentlyOpenBy {
						if v == r.RemoteAddr {
							dashboard.CurrentlyOpenBy = append(dashboard.CurrentlyOpenBy[:i], dashboard.CurrentlyOpenBy[i+1:]...)
							status.Meerkat.Dashboards[stream] = dashboard
							break
						}
					}
				}
				dashboardLock.Unlock()
			} else {
				<-r.Context().Done()
			}
		}()

		server.ServeHTTP(w, r)
	})
}
