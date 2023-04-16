package meerkat

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"olowe.co/icinga"
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
	events        chan icinga.Event
	subscribe     chan chan<- icinga.Event
	unsubscribe   chan chan<- icinga.Event
	subscriptions map[chan<- icinga.Event]bool
}

func NewEventStream(client *icinga.Client) *EventStream {
	return &EventStream{
		client:        client,
		events:        make(chan icinga.Event),
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

func (es *EventStream) Subscribe() error {
	name := "StateChange" // TODO(otl) support more event types?
	events, err := es.client.Subscribe(name, "meerkat", "")
	if err != nil {
		return fmt.Errorf("subscribe to %s: %w", name, err)
	}
	for {
		select {
		case ev := <-events:
			for sub := range es.subscriptions {
				sub <- ev
			}
		case ch := <-es.subscribe:
			es.subscriptions[ch] = true
		case ch := <-es.unsubscribe:
			delete(es.subscriptions, ch)
		}
	}
}

func (es *EventStream) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	ch := make(chan icinga.Event)
	go es.receive(req.Context(), ch)
	w.Header().Set("Content-Type", "text/event-stream")
	for ev := range ch {
		name := ev.Host
		if ev.Service != "" {
			name = name + "!" + ev.Service
		}
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
