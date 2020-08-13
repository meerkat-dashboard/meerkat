import { h } from 'preact';
import { route } from 'preact-router';

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