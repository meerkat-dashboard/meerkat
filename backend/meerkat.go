package main

import "olowe.co/icinga"

func worstHost(hosts []icinga.Host) together {
	var max icinga.HostState
	var ack int
	for _, host := range hosts {
		if host.Acknowledgement {
			ack = 1
		}
		if host.State > max && host.StateType == icinga.StateHard {
			max = host.State
		}
	}
	return together{MaxState: int64(max), Acknowledged: int64(ack)}
}

func worstService(services []icinga.Service) together {
	var max icinga.ServiceState
	var ack int
	for _, svc := range services {
		if svc.Acknowledgement {
			ack = 1
		}
		if svc.State > max && svc.StateType == icinga.StateHard {
			max = svc.State
		}
	}
	return together{MaxState: int64(max), Acknowledged: int64(ack)}
}
