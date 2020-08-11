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