package meerkat

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/meerkat-dashboard/icinga-go"
)

// An EventStream distributes messages from the Icinga2 Event Stream
// API to subscribers via HTTP Server-sent events.
// Currently only Icinga's "StateChange" stream is supported.
// Only the default server-sent event message type "message" is used.
// On receipt of an Icinga Event, subscribers receive a message
// consisting of the name of the corresponding Host or Service object
// from the Event.
// For example, if the host "www.example.com" changed state, the message would be:
//
//	data: www.example.com
//
// If a service "ping" of the host "app.prod.company.example" changed state,
// the message would be:
//
//	data: app.prod.company.example!ping
type EventStream struct {
	client        *icinga.Client
	subscribe     chan chan<- icinga.Event
	unsubscribe   chan chan<- icinga.Event
	subscriptions map[chan<- icinga.Event]bool
}

func NewEventStream(client *icinga.Client) *EventStream {
	return &EventStream{
		client:        client,
		subscribe:     make(chan chan<- icinga.Event),
		unsubscribe:   make(chan chan<- icinga.Event),
		subscriptions: make(map[chan<- icinga.Event]bool),
	}
}

func (es *EventStream) receive(ctx context.Context, ch chan icinga.Event) {
	es.subscribe <- ch
	select {
	case <-ctx.Done():
		es.unsubscribe <- ch
	}
}

func (es *EventStream) close() {
	for sub := range es.subscriptions {
		close(sub)
	}
}

func (es *EventStream) Subscribe(eventName []string) error {
	events, err := es.client.Subscribe(eventName, "meerkat", "")

	if err != nil {
		return fmt.Errorf("subscribe to %s: %w", eventName, err)
	}

	for {
		select {
		case ev := <-events:
			if ev.Error != nil {
				return ev.Error
			}
			for sub := range es.subscriptions {
				sub <- ev
			}
		case ch := <-es.subscribe:
			es.subscriptions[ch] = true
		case ch := <-es.unsubscribe:
			delete(es.subscriptions, ch)
		}
	}
	return nil
}

func (es *EventStream) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	ch := make(chan icinga.Event)
	go es.receive(req.Context(), ch)
	w.Header().Set("content-type", "text/event-stream")
	for ev := range ch {
		name := ev.Host
		if ev.Service != "" {
			name = name + "!" + ev.Service
		}
		fmt.Fprintf(w, "event: %s\n", ev.Type)
		_, err := fmt.Fprintf(w, "data: %s\n\n", name)
		if err != nil {
			log.Println(err) // TODO(otl): do we really care if client disconnects?
			break
		}

		if wf, ok := w.(http.Flusher); ok {
			wf.Flush()
		}
	}
}
