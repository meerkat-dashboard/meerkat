import { h, Fragment, createRef } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
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
			case 0: return 'up';
			case 1: return 'down';
			case 1: return 'down';
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
				input =
					<Combobox
						filter='contains'
						placeholder="Choose away..."
						textField='id'
						valueField='id'
						defaultValue={value}
						data={opts}
						onSelect={updateOptions}
						data-cy="card:check_options"
					/>
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
		<Combobox
			placeholder="Make your choice..."
			onChange={s => { setSelection(s.value); updateOptions({selection: s.value}) }}
			defaultValue={selection}
			data={selectionTypes}
			valueField="value"
			textField="label"
			data-cy="card:check"
		/>
		<br/>
		{typeOptions}
	</div>
}


export function flattenObject(obj, prefix=false, result=null) {
	result = result || {};

	if (prefix && typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0) {
	  	result[prefix] = Array.isArray(obj) ? [] : {};
	  	return result;
	}

	prefix = prefix ? prefix + '.' : '';

	for (const key in obj) {
	  	if (Object.prototype.hasOwnProperty.call(obj, key)) {
			if (typeof obj[key] === 'object' && obj[key] !== null) {
			  	flattenObject(obj[key], prefix + key, result);
			} else {
			  	result[prefix + key] = obj[key];
			}
	  	}
	}
	return result;
}


export function IcingaHostVars({optionsID, updateOptions, options}) {
	const [hosts, setHosts] = useState("");
	const [hostInfo, setHostInfo] = useState("");
	const [hostInfoKeys, setHostInfoKeys] = useState("");

	const searchHosts = async () => {
		setHosts(<Combobox placeholder="Loading..." busy value="" data={[]} busySpinner={<div class="loading" style="width: 14px; height: 14px; margin-left: 10px" />} />);

		let opts = null;
		let input = "";
		let input2 = "";
		let input3 = "";

		opts = [];

		let hosts = await meerkat.getIcingaHosts();
		hosts.sort(sortHost);

		for (const host of hosts) {
			opts.push({id: host.id, selection: "hosts", objectType: "host", filter: `host.name=="${host.id}"`})
		}

		if (opts !== null) {
			input = <Combobox filter='contains' placeholder="Choose away..." textField='id' valueField='id' defaultValue={optionsID} data={opts} onSelect={updateOptions}/>
		}

		if (input !== null) {
			setHosts(input);
		}

		let hostInfo = await meerkat.getIcingaHostInfo(optionsID)
		let attrs = hostInfo.results[0].attrs;
		let hInfo = [];

		for (const [key, value] of Object.entries(attrs)) {
			hInfo.push({id: key});
		}

		if (hInfo !== null) {
			input2 = <Combobox filter='contains' placeholder="Choose away..." textField='id' valueField='id' defaultValue={options.dynamicText} data={hInfo} onSelect={value => updateOptions({dynamicText: value.id, dynamicText2: ''})}/>
		}

		if (input2 !== null) {
			setHostInfo(input2)
		}

		let hInfo2 = [];

		if (attrs[options.dynamicText] && (Array.isArray(attrs) || typeof attrs[options.dynamicText] === 'object')) {
			updateOptions({dynamicText2Structure: true});

			let flat = flattenObject(attrs[options.dynamicText]);

			for (const [key, value] of Object.entries(flat)) {
				hInfo2.push({id: key});
			}

			if (hInfo2 !== null) {
				input3 = <Combobox filter='contains' placeholder="Choose away..." textField='id' valueField='id' defaultValue={options.dynamicText2} data={hInfo2} onSelect={value => updateOptions({dynamicText2: value.id})}/>
			}

		} else {
			updateOptions({dynamicText2Structure: false});
		}

		if (input3 !== null) {
			setHostInfoKeys(input3)
		}
	}

	useEffect(searchHosts, [optionsID, options.dynamicText])

	return <div>
		{hosts}
		<br/>
		{hostInfo}
		<br/>
		{hostInfoKeys}
	</div>
}


export function dynamicTextHelper(attribute) {
	if (typeof attribute === 'boolean') {
		if (attribute !== false) {
			attribute = 'true';
		} else {
			attribute = 'false';
		}
	} else if (typeof attribute === 'number') {
		return attribute;
	} else if (!attribute) {
		attribute = "No Data"
	}

	return attribute;
}


// get check data: performance and plugin output
// then invoke callback to propagate state
export function getCheckData(options, callback) {
	meerkat.getCheckResult(options.objectType, options.id)
	.then(c => {
		const checkData = {
			performance: null,
			pluginOutput: null,
		};

		// extract & transform performance data
		let perfData = c.results ? c.results[0].attrs.last_check_result.performance_data : null;
		if (perfData !== null && typeof perfData !== "undefined" && perfData.length > 0) {
			let arrPerf = [];
			for (var i = 0; i < perfData.length; i++){
				if (perfData[i].includes('=')) {
					arrPerf.push(perfData[i].split(';')[0]);
				}
			}
			checkData.performance = Object.fromEntries(arrPerf.map(s => s.split('=')));
		}

		checkData.pluginOutput = c.results ? c.results[0].attrs.last_check_result.output : null;

		callback(checkData);
	});
}


export function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {ref.current = value});
	return ref.current;
}


let okAudio = null;
let warningAudio = null;
let criticalAudio = null;
let unknownAudio = null;
let upAudio = null;
let downAudio = null;


export function alertSounds(checkState, options, dashboard) {
	const oldCheckState = usePrevious(checkState);

	if ((checkState !== null && oldCheckState !== null) && (checkState !== oldCheckState)) {
		switch(checkState){
			case 'ok':
				let oldDashOk = usePrevious(dashboard.okSound);

				if (options.okSound) {
					let oldOptionsOk = usePrevious(options.okSound);

					if (!okAudio || (options.okSound !== oldOptionsOk)) {
						okAudio = new Audio(options.okSound);
					}

				} else if (!okAudio || (dashboard.okSound !== oldDashOk)) {
					okAudio = new Audio(dashboard.okSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					okAudio.play();
				}
			break;
			case 'warning':
				let oldDashWarning = usePrevious(dashboard.warningSound);

				if (options.warningSound) {
					let oldOptionsWarning = usePrevious(options.warningSound);

					if (!warningAudio || (options.warningSound !== oldOptionsWarning)) {
						warningAudio = new Audio(options.warningSound);
					}

				} else if (!warningAudio || (dashboard.warningSound !== oldDashWarning)) {
					warningAudio = new Audio(dashboard.warningSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					warningAudio.play();
				}
			break;
			case 'critical':
				let oldDashCritical = usePrevious(dashboard.criticalSound);

				if (options.criticalSound) {
					let oldOptionsCritical = usePrevious(options.criticalSound);

					if (!criticalAudio || (options.criticalSound !== oldOptionsCritical)) {
						criticalAudio = new Audio(options.criticalSound);
					}

				} else if (!criticalAudio || (dashboard.criticalSound !== oldDashCritical)) {
					criticalAudio = new Audio(dashboard.criticalSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					criticalAudio.play();
				}
			break;
			case 'unknown':
				let oldDashUnknown = usePrevious(dashboard.unknownSound);

				if (options.unknownSound) {
					let oldOptionsUnknown = usePrevious(options.unknownSound);

					if (!unknownAudio || (options.unknownSound !== oldOptionsUnknown)) {
						unknownAudio = new Audio(options.unknownSound);
					}

				} else if (!unknownAudio || (dashboard.unknownSound !== oldDashUnknown)) {
					unknownAudio = new Audio(dashboard.unknownSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					unknownAudio.play();
				}
			break;
			case 'up':
				let oldDashUp = usePrevious(dashboard.upSound);

				if (options.upSound) {
					let oldOptionsUp = usePrevious(options.upSound);

					if (!upAudio || (options.upSound !== oldOptionsUp)) {
						upAudio = new Audio(options.upSound);
					}

				} else if (!upAudio || (dashboard.upSound !== oldDashUp)) {
					upAudio = new Audio(dashboard.upSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					upAudio.play();
				}
			break;
			case 'down':
				let oldDashDown = usePrevious(dashboard.downSound);

				if (options.downSound) {
					let oldOptionsDown = usePrevious(options.downSound);

					if (!downAudio || (options.downSound !== oldOptionsDown)) {
						downAudio = new Audio(options.downSound);
					}

				} else if (!downAudio || (dashboard.downSound !== oldDashDown)) {
					downAudio = new Audio(dashboard.downSound);
				}

				if ((dashboard.globalMute || options.muteAlerts) === false) {
					downAudio.play();
				}
			break;
		}
	}
}


export function linkHelper(element, ele, dashboard){
	let target = null;
	let link = element.options.linkURL;

	if (dashboard.tabLink) {
		target = 'blank';
	}

	for (const [key, property] of Object.entries(dashboard.variables)) {
		if (element.options.hasOwnProperty('linkURL') && element.options.linkURL.includes(`~${key}~`)) {
			let reg = new RegExp('~(' + key + ')~', 'g');
			link = link.replaceAll(reg, encodeURIComponent(property));
		}
	}

	if (element.options.linkURL && element.type === 'static-text') {
		if (element.options.linkURL.includes('http') ) {
			ele = <a id="text-link" href={link} target={target}>{ele}</a>
		} else {
			ele = <a id="text-link" href={`https://${link}`} target={target}>{ele}</a>
		}
	} if (element.options.linkURL && element.type === 'dynamic-text') {
		if (element.options.linkURL.includes('http') ) {
			ele = <a id="text-link" href={link} target={target}>{ele}</a>
		} else {
			ele = <a id="text-link" href={`https://${link}`} target={target}>{ele}</a>
		}
	} else if (element.options.linkURL) {
		if (element.options.linkURL.includes('http') ) {
			ele = <a id="a-link" href={link} target={target}>{ele}</a>
		} else {
			ele = <a id="a-link" href={`https://${link}`} target={target}>{ele}</a>
		}
	}

	return ele;
}


export async function fetchHandler(string) {
	if (navigator.onLine) {
		try {
			const res = await fetch(string);
			if (res.status !== 200) {
				return 3;
			}
			return res.json();
		} catch (e) {
			return false;
		}
	} else {
		return false;
	}
}


export function filterReplace(filter, dashboard) {
	if (dashboard.hasOwnProperty('variables')) {
		for (const [key, value] of Object.entries(dashboard.variables)) {
			if (filter.includes(`~${key}~`)) {
				let reg = new RegExp('~(' + key + ')~', 'g');
				filter = filter.replaceAll(reg, value);
			}
		}
	}
	return filter;
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
			<span class="close-icon" onClick={e => removeTag(i)} data-cy="dashboard#remove-tag">x</span>
		</div>
	})

	return <Fragment>
		<form onSubmit={addTag}>
			<label for="add-tag">Tags <span class="subtle tiny">Enter to submit</span></label>
			{tagElements}
			<input class="form-control" type="text" id="add-tag" name="add-tag" ref={inputRef} placeholder="Enter a new tag"
				pattern="[a-z\d\-_]+" title="only lower case letters, numbers, '-' and '_' are allowed"
				data-cy="dashboard:tag" />
		</form>
	</Fragment>
}


// adapted from https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L10304
export function debounce(func, wait, options) {
	var lastArgs,
		lastThis,
		maxWait,
		result,
		timerId,
		lastCallTime,
		lastInvokeTime = 0,
		leading = false,
		maxing = false,
		trailing = true;

	if (typeof func != 'function') {
		throw new TypeError("Expected a function");
	}
	wait = Number(wait) || 0;
	if (typeof options === 'object') {
		leading = !!options.leading;
		maxing = 'maxWait' in options;
		maxWait = maxing ? Math.max(toNumber(options.maxWait) || 0, wait) : maxWait;
		trailing = 'trailing' in options ? !!options.trailing : trailing;
	}

	function invokeFunc(time) {
		var args = lastArgs,
			thisArg = lastThis;

		lastArgs = lastThis = undefined;
		lastInvokeTime = time;
		result = func.apply(thisArg, args);
		return result;
	}

	function leadingEdge(time) {
		// Reset any `maxWait` timer.
		lastInvokeTime = time;
		// Start the timer for the trailing edge.
		timerId = setTimeout(timerExpired, wait);
		// Invoke the leading edge.
		return leading ? invokeFunc(time) : result;
	}

	function remainingWait(time) {
		var timeSinceLastCall = time - lastCallTime,
			timeSinceLastInvoke = time - lastInvokeTime,
			timeWaiting = wait - timeSinceLastCall;

		return maxing
			? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
			: timeWaiting;
	}

	function shouldInvoke(time) {
		var timeSinceLastCall = time - lastCallTime,
			timeSinceLastInvoke = time - lastInvokeTime;

		// Either this is the first call, activity has stopped and we're at the
		// trailing edge, the system time has gone backwards and we're treating
		// it as the trailing edge, or we've hit the `maxWait` limit.
		return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
			(timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
	}

	function timerExpired() {
		var time = Date.now();
		if (shouldInvoke(time)) {
			return trailingEdge(time);
		}
		// Restart the timer.
		timerId = setTimeout(timerExpired, remainingWait(time));
	}

	function trailingEdge(time) {
		timerId = undefined;

		// Only invoke if we have `lastArgs` which means `func` has been
		// debounced at least once.
		if (trailing && lastArgs) {
			return invokeFunc(time);
		}
		lastArgs = lastThis = undefined;
		return result;
	}

	function cancel() {
		if (timerId !== undefined) {
			clearTimeout(timerId);
		}
		lastInvokeTime = 0;
		lastArgs = lastCallTime = lastThis = timerId = undefined;
	}

	function flush() {
		return timerId === undefined ? result : trailingEdge(Date.now());
	}

	function debounced() {
		var time = Date.now(),
			isInvoking = shouldInvoke(time);

		lastArgs = arguments;
		lastThis = this;
		lastCallTime = time;

		if (isInvoking) {
			if (timerId === undefined) {
				return leadingEdge(lastCallTime);
			}
			if (maxing) {
				// Handle invocations in a tight loop.
				clearTimeout(timerId);
				timerId = setTimeout(timerExpired, wait);
				return invokeFunc(lastCallTime);
			}
		}
		if (timerId === undefined) {
			timerId = setTimeout(timerExpired, wait);
		}
		return result;
	}
	debounced.cancel = cancel;
	debounced.flush = flush;
	return debounced;
}
