import { h, Fragment, JSX,  } from 'preact';
import { RouterProps, route, RoutableProps } from 'preact-router';
import { useState, useEffect, StateUpdater, useReducer } from 'preact/hooks';

import { CardOptionFields, CardOptions } from './elements/card';
import { routeParam } from './util';

function sortHost(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

function sortService(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function IcingaCheckList(props) {
	const [hosts, setHosts] = useState(null);
	const [services, setServices] = useState(null);
	
	useEffect(() => {
		fetch(`/icinga/hosts`)
			.then(res => res.json())
			.then(h => {
				h.sort(sortHost);
				setHosts(h);
			});

		fetch(`/icinga/services`)
			.then(res => res.json())
			.then(s => {
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

	return <select value={props.check.checkID} onInput={e => props.updateCheckID(e.currentTarget.value)}>
		{options}
	</select>
}

//The root sidebar 
function EditPanel(props) {
	const updateCheckOptions = (options) => {
		const newOptions = Object.assign(props.check.options, options)
		props.updateCheck({...props.check, options: newOptions})
	}

	const checkTypeOptions = {
		'card': <CardOptionFields updateOptions={updateCheckOptions} check={props.check} />,
		'svg': <div>svg options</div>,
		'image': <div>image options</div>
	}

	return <Fragment>
		<label for="name">Name</label>
		<input id="name" type="text" placeholder="Cool check" value={props.check.title}
			onInput={e => props.updateCheck({...props.check, title: e.currentTarget.value})} />

		<label>Visual Type</label>
		<select name="item-type" value={props.check.type}
			onInput={e => props.updateCheck({...props.check, type: e.currentTarget.value})}>
			<option value="card">Card</option>
			<option value="svg">SVG</option>
			<option value="image">Image</option>
		</select>

		<label>Icinga Host or Service</label>
		<IcingaCheckList check={props.check}
			updateCheckID={checkID => props.updateCheck({...props.check, checkID: checkID})} />

		{checkTypeOptions[props.check.type]}
	</Fragment>
}

function CheckListPanel(props) {
	const checkList = props.checks.map((check, index) => (
		<div class="check-item" onClick={ e => routeParam('id', index.toString()) }>
			<div>{check.title}</div>
		</div>
	));

	return <div class="check-list">
		{checkList}
	</div>
}

//Checks view for the sidebar
export function SidePanelChecks(props) {
	const addCheck = e => props.dashboardDispatch({type: 'addCheck'});

	let view = null;
	if(props.selectedElement !== null && props.dashboard.checks[props.selectedElement]) {
		const updateCheck = check => {
			props.dashboardDispatch({
				type: 'updateCheck',
				checkIndex: props.selectedElement,
				check: check
			});
		}

		view = <EditPanel updateCheck={updateCheck} check={props.dashboard.checks[props.selectedElement]} />
	} else if(props.dashboard.checks.length > 0) {
		view = <CheckListPanel checks={props.dashboard.checks} />
	} else {
		//No checks create one
		view = <div class="subtle" style="flex-direction: column; font-size: 16px;">
			<div>No checks added.</div>
			<a onClick={addCheck}>Create one</a>
		</div>
	}

	return <Fragment>
		<div class="lefty-righty" style="margin-bottom: 20px;">
			<h3>Checks</h3>
			<button class="small" onClick={addCheck}>New</button>
		</div>
		{view}
	</Fragment>
}