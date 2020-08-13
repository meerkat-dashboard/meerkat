import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { CardOptionFields } from './elements/card';
import { routeParam, removeParam } from './util';
import { route } from 'preact-router';
import * as meerkat from './meerkat';

function sortHost(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

function sortService(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function IcingaCheckList({check, updateCheckID}) {
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

	return <select value={check.checkID} onInput={e => updateCheckID(e.currentTarget.value)}>
		{options}
	</select>
}

function CheckListPanel({checks, addCheck}) {
	if(checks.length < 1) {
		return <div class="subtle" style="flex-direction: column; font-size: 16px;">
			<div>No checks added.</div>
			<a onClick={addCheck}>Create one</a>
		</div>
	}

	const checkList = checks.map((check, index) => (
		<div class="check-item" onClick={ e => routeParam('selectedCheckId', index.toString()) }>
			<div>{check.title}</div>
		</div>
	));

	return <div class="check-list">
		{checkList}
	</div>
}

export function CheckSettings({selectedCheck, updateCheck}) {
	if(selectedCheck === null) {
		return null;
	}

	const updateCheckOptions = (options) => {
		const newOptions = Object.assign(selectedCheck.options, options)
		updateCheck({...selectedCheck, options: newOptions})
	}

	const checkTypeOptions = {
		'card': <CardOptionFields updateOptions={updateCheckOptions} check={selectedCheck} />,
		'svg': <div>svg options</div>,
		'image': <div>image options</div>
	}

	return <div class="editor settings-overlay">
		<div class="options">
			<div class="lefty-righty spacer">
				<h3 class="no-margin">{selectedCheck.title}</h3>
				<svg class="feather" onClick={e => removeParam('selectedCheckId')}>
					<use xlinkHref={`/res/svgs/feather-sprite.svg#x`}/>
				</svg>
			</div>
			<div class="settings">
				<label for="name">Name</label>
				<input id="name" type="text" placeholder="Cool check" value={selectedCheck.title}
					onInput={e => updateCheck({...selectedCheck, title: e.currentTarget.value})} />

				<label>Visual Type</label>
				<select name="item-type" value={selectedCheck.type}
					onInput={e => updateCheck({...selectedCheck, type: e.currentTarget.value})}>
					<option value="card">Card</option>
					<option value="svg">SVG</option>
					<option value="image">Image</option>
				</select>

				<label>Icinga Host or Service</label>
				<IcingaCheckList check={selectedCheck}
					updateCheckID={checkID => updateCheck({...selectedCheck, checkID: checkID})} />

				{checkTypeOptions[selectedCheck.type]}
			</div>
		</div>
	</div>
}

//Checks view for the sidebar
export function SidePanelChecks({dashboard, dashboardDispatch}) {
	const addCheck = e => {
		const newId = dashboard.checks.length;
		dashboardDispatch({type: 'addCheck'});
		routeParam('selectedCheckId', newId);
	}

	return <Fragment>
		<div class="lefty-righty">
			<h3>Checks</h3>
			<button class="small hollow" onClick={addCheck}>New</button>
		</div>
		<CheckListPanel checks={dashboard.checks} addCheck={addCheck} />
	</Fragment>
}