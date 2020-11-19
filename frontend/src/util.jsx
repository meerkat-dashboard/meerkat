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

function sortHostGroups(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function sortServiceGroups(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

export function IcingaCheckList({currentCheckopts, updateOptions}) {
	const [typeOptions, setTypeOptions] = useState("");
	const [selection, setSelection] = useState(currentCheckopts.selection)

	const updateTypeOptions = async () => {
		if (selection === "") {
			setTypeOptions("");
		} else {
			setTypeOptions(<Combobox placeholder="Loading..." busy value="" data={[]} busySpinner={<div class="loading" style="width: 14px; height: 14px; margin-left: 10px" />} />);
			let opts = null;
			let input = "";
			let value = "";

			if (currentCheckopts.selection == selection) {
				value = currentCheckopts.id;
			}

			if (selection === "hosts") {
				opts = [];
				let hosts = await meerkat.getIcingaHosts();
				hosts.sort(sortHost);
				for (const host of hosts) {
					opts.push({id: host.id, selection: "hosts", objectType: "host", filter: `host.name=="${host.id}"`})
				}
			} else if (selection === "services") {
				opts = [];
				let services = await meerkat.getIcingaServices();
				services.sort(sortService);
				for (const service of services) {
					opts.push({id: service.id, selection: "services", objectType: "service", filter: `service.__name=="${service.id}"`})
				}
			} else if (selection === "host-groups") {
				opts = [];
				let hostGroups = await meerkat.getIcingaHostGroups();
				hostGroups.sort(sortHostGroups);
				for (const hostGroup of hostGroups) {
					opts.push({id: hostGroup.id, selection: "host-groups", objectType: "host", filter: `"${hostGroup.id}" in host.groups`})
				}
			} else if (selection === "service-groups") {
				opts = [];
				let serviceGroups = await meerkat.getIcingaServiceGroups();
				serviceGroups.sort(sortServiceGroups);
				for (const serviceGroup of serviceGroups) {
					opts.push({id: serviceGroup.id, selection: "service-groups", objectType: "service", filter: `"${serviceGroup.id}" in service.groups`})
				}
			} else if (selection === "host-filter") {
				input = <input class="form-control" id="host-filter" name="host_filter" value={currentCheckopts.filter} type="text" placeholder="host.foo == 42" onInput={e => updateOptions({filter: e.target.value, objectType: "host"})} />
			} else if (selection === "service-filter") {
				input = <input class="form-control" id="service-filter" name="service_filter" value={currentCheckopts.filter} type="text" placeholder="service.foo == 42" onInput={e => updateOptions({filter: e.target.value, objectType: "service"})} />
			} else if (selection === "host-services") {
				opts = [];
				let hosts = await meerkat.getIcingaHosts();
				for (const host of hosts) {
					opts.push({id: host.id, selection: "host-services", objectType: "service", filter: `host.name=="${host.id}"`})
				}
			}

			if (opts !== null) {
				input = <Combobox filter='contains' placeholder="Choose away..." textField='id' valueField='id' defaultValue={value} data={opts} onSelect={updateOptions} />
			}

			if (input !== null) {
				setTypeOptions(input);
			}
		}
	}

	useEffect(updateTypeOptions, [selection])

	let selectionTypes = [
		{ value: "hosts",          label: "Hosts"          		   },
		{ value: "services",       label: "Services"       		   },
		{ value: "host-groups",    label: "Host Groups"    		   },
		{ value: "service-groups", label: "Service Groups" 		   },
		{ value: "host-filter",    label: "Host Filter"    		   },
		{ value: "service-filter", label: "Service Filter" 		   },
		{ value: "host-services",  label: "All Services on a Host" },
	]

	return <div>
		<Combobox placeholder="Make your choice..." onChange={s => { setSelection(s.value); updateOptions({selection: s.value}) }} defaultValue={selection} data={selectionTypes} valueField="value" textField="label" />
		<br/>
		{typeOptions}
	</div>
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
