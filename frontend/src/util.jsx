import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';

import * as meerkat from './meerkat';

//Set the a URL paramater, this will keep the current URL and parameters intact,
//and update the one given. Useful to add search filters etc.
export function routeParam(name, value) {
	const params = new URLSearchParams(window.location.search);
	params.set(name, value);

	route(`${window.location.pathname}?${params}`);
}

export function removeParam(name) {
	const params = new URLSearchParams(window.location.search);
	params.delete(name);

	if(params.keys.length < 1) {
		//Don't include the '?' if there are no params
		route(window.location.pathname);
	} else {
		route(`${window.location.pathname}?${params}`);
	}
}

export function icingaCheckTypeFromId(checkId) {
	if(checkId.includes('!')) {
		return 'service';
	} else {
		return 'host';
	}
}

export function icingaResultCodeToCheckState(checkType, resultCode) {
	if(checkType === 'service') {
		switch(resultCode){
			case 0: return 'ok';
			case 1: return 'warning';
			case 2: return 'critical';
			case 3: return 'unknown';
		}
	} else if(checkType === 'host') {
		switch(resultCode){
			case 0: return 'up';
			case 1: return 'up';
			case 2: return 'down';
			case 3: return 'down';
		}
	}

	return 'invalid'
}


function sortHost(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

function sortService(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

export function IcingaCheckList({checkId, updateCheckId}) {
	const [hosts, setHosts] = useState(null);
	const [services, setServices] = useState(null);
	
	useEffect(() => {
		meerkat.getIcingaHosts().then(h => {
			h.sort(sortHost);
			setHosts(h);
		});

		meerkat.getIcingaServices().then(s => {
			s.sort(sortService);
			setServices(s)
		});
	}, [])

	if(hosts === null || services === null) {
		return <div class="loading small">Loading hosts and services</div>
	}

	const options = [];
	options.push(<option value={null}></option>)
	options.push(<option disabled><b>HOSTS</b></option>)
	for(const host of hosts) {
		options.push(<option value={host.id}>{host.displayName}</option>)
	}

	options.push(<option disabled><b>SERVICES</b></option>)
	for(const service of services) {
		options.push(<option value={service.id}>{service.hostName} - {service.displayName}</option>)
	}

	return <select value={checkId} onInput={e => updateCheckId(e.currentTarget.value)}>
		{options}
	</select>
}