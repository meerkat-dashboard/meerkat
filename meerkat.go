package main

import "olowe.co/icinga"

type together struct {
	MaxState     int
	Acknowledged bool
}

func worstHost(hosts []icinga.Host) together {
	var max icinga.HostState
	var acks int
	for _, host := range hosts {
		if host.Acknowledgement {
			acks++
		}
		if host.State > max && host.StateType == icinga.StateHard {
			max = host.State
		}
	}
	t := together{MaxState: int(max)}

	// if any are not acknowledged, the "worst" state is unacknowledged
	if acks == len(hosts) {
		// all were acknowledged, so we're safe to report that.
		t.Acknowledged = true
	}
	return t
}

func worstService(services []icinga.Service) together {
	var max icinga.ServiceState
	var acks int
	for _, svc := range services {
		if svc.Acknowledgement {
			acks++
		}
		if svc.State > max && svc.StateType == icinga.StateHard {
			max = svc.State
		}
	}
	t := together{MaxState: int(max)}

	// if any are not acknowledged, the "worst" state is unacknowledged
	if acks == len(services) {
		// all were acknowledged, so we're safe to report that.
		// 1 is "true" to the frontend; not using booleans :(
		t.Acknowledged = true
	}
	return t
}
