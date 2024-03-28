package main

import (
	"testing"

	"github.com/dgraph-io/ristretto"
	"github.com/meerkat-dashboard/meerkat"
)

func TestEvents(t *testing.T) {
	dashboard := Dashboard{Title: "Test", Slug: "test", Folder: "test", CurrentlyOpenBy: []string{}, Order: meerkat.Order{
		Ok: 6, Warning: 4, Critical: 0, Unknown: 2, CriticalAck: 1, WarningAck: 5, UnknownAck: 3,
	}}

	elementList := []ElementStore{}

	element := ElementStore{Name: "test", Type: "service"}
	element.Objects = append(element.Objects, "service-test-1")
	element.Objects = append(element.Objects, "service-test-2")
	element.Objects = append(element.Objects, "service-test-3")

	elementList = append(elementList, element)

	cache, _ = ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e7,
		MaxCost:     1 << 30,
		BufferItems: 64,
	})

	dashboardCache = make(map[string][]ElementStore)
	dashboardCache[dashboard.Slug] = append(dashboardCache[dashboard.Slug], element)

	event := Event{Acknowledgement: false, CheckResult: CheckResult{State: 2, Output: "", PerformanceData: []string{}}, DowntimeDepth: 0, Host: "test", Service: "service-test-1", Timestamp: 0, Type: "service"}
	event.CheckResult.VarsAfter.StateType = 1
	handleKey(dashboard, elementList, "service-test-1", event)

	event = Event{Acknowledgement: false, CheckResult: CheckResult{State: 0, Output: "", PerformanceData: []string{}}, DowntimeDepth: 0, Host: "test", Service: "service-test-2", Timestamp: 0, Type: "service"}
	event.CheckResult.VarsAfter.StateType = 1
	handleKey(dashboard, elementList, "service-test-2", event)

	event = Event{Acknowledgement: false, CheckResult: CheckResult{State: 0, Output: "", PerformanceData: []string{}}, DowntimeDepth: 0, Host: "test", Service: "service-test-3", Timestamp: 0, Type: "service"}
	event.CheckResult.VarsAfter.StateType = 1
	handleKey(dashboard, elementList, "service-test-3", event)

	if dashboardCache[dashboard.Slug][0].LastEvent.Name != "service-test-1" {
		t.Errorf("Result was incorrect, got: %s, want: %s.", dashboardCache[dashboard.Slug][0].LastEvent.Name, "service-test-1")
	}
}
