package main

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

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
	Command           []string    `json:"command,omitempty"`
	ExecutionEnd      float64     `json:"execution_end,omitempty"`
	ExecutionStart    float64     `json:"execution_start,omitempty"`
	ExitStatus        json.Number `json:"exit_status,omitempty"`
	Output            string      `json:"output,omitempty"`
	PerformanceData   []string    `json:"performance_data,omitempty"`
	PreviousHardState int         `json:"previous_hard_state,omitempty"`
	ScheduleEnd       float64     `json:"schedule_end,omitempty"`
	ScheduleStart     float64     `json:"schedule_start,omitempty"`
	SchedulingSource  string      `json:"scheduling_source,omitempty"`
	State             json.Number `json:"state,omitempty"`
	TTL               int         `json:"ttl,omitempty"`
	Type              string      `json:"type,omitempty"`
	VarsAfter         *struct {
		Attempt   json.Number `json:"attempt,omitempty"`
		Reachable bool        `json:"reachable,omitempty"`
		State     json.Number `json:"state,omitempty"`
		StateType json.Number `json:"state_type,omitempty"`
	} `json:"vars_after,omitempty"`
	VarsBefore *struct {
		Attempt   json.Number `json:"attempt,omitempty"`
		Reachable bool        `json:"reachable,omitempty"`
		State     json.Number `json:"state,omitempty"`
		StateType json.Number `json:"state_type,omitempty"`
	} `json:"vars_before,omitempty"`
}

func handleEvent(response string) {
	var event Event
	err := json.Unmarshal([]byte(response), &event)
	if err != nil {
		//	fmt.Println(err)
		//	fmt.Printf("%+v\n", response)
	}
	name := event.Host

	if event.Service != "" {
		name = name + "!" + event.Service
	}
	fmt.Println(name)

	server.Publish("icinga", &sse.Event{
		Event: []byte(event.Type),
		Data:  []byte(name),
	})
	status.Backends.Icinga.Connections.EventStreams.LastEventReceived = int(time.Now().UnixMilli())
	addEvent(name, event.Type)
}

func EventListener() {
	fmt.Println("Subscribing to event streams")

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
		log.Println("Error creating request:", err)
		return
	}
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(config.IcingaUsername, config.IcingaPassword)

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)
Loop:
	for {
		select {
		default:
			line, err := reader.ReadBytes('\n')

			if err != nil {
				fmt.Println("Error reading stream", err)
				break Loop
			}

			handleEvent(string(line))
		case <-time.After(time.Duration(config.IcingaEventTimeout) * time.Second):
			log.Printf("Event stream timed out.\n")
			break Loop
		}
	}

	fmt.Println("Connection was closed by the server")
}

func doEvents() {
	go func() {
		for {
			EventListener()
			fmt.Println("Disconnected from event stream waiting 10 seconds")
			time.Sleep(time.Second * 10)
		}
	}()
}
