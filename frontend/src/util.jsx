import { h, Fragment, createRef } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Combobox } from 'react-widgets';

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
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function sortService(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
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
	for(const host of hosts) {
		options.push(host.id)
	}

	for(const service of services) {
		options.push(service.id)
	}

	return <Combobox filter='contains' defaultValue={checkId} data={options} onSelect={e => updateCheckId(e)} />
}

export function TagEditor({tags, updateTags}) {
	const inputRef = createRef();
	const addTag = e => {
		e.preventDefault();
		updateTags(tags.concat(e.currentTarget['add-tag'].value));
		inputRef.current.value = '';
	}

	const removeTag = index => {
		tags.splice(index, 1);
		updateTags(tags);
	}

	const tagElements = tags.map((tag, i) => {
		return <div class="pill tag btn-dark">
			<span>{tag}</span>
			<span class="close-icon" onClick={e => removeTag(i)}>x</span>
		</div>
	})

	return <Fragment>
		<form onSubmit={addTag}>
			<label for="add-tag">Tags <span class="subtle tiny">Enter to submit</span></label>
			{tagElements}
			<input class="form-control" type="text" id="add-tag" name="add-tag" ref={inputRef} placeholder="Enter a new tag"
				pattern="[a-z\d\-_]+" title="only lower case letters, numbers, '-' and '_' are allowed"/>
		</form>
	</Fragment>
}