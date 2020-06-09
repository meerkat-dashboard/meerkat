import { h, Fragment, JSX,  } from 'preact';
import { RouterProps, route, RoutableProps } from 'preact-router';
import { useState, useEffect, StateUpdater, useReducer } from 'preact/hooks';

import { OptionalPanelProps, Check } from './editor';
import { routeParam } from './util';

function IcingaCheckList() {


	return <div class="loading small">Loading checks</div>
}

function EditPanel(props: {updateCheck: (Check) => void, check: Check}) {
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

		<label>Icinga Check</label>
		<IcingaCheckList />
	</Fragment>
}

function CheckListPanel(props: RouterProps & {checks: Array<Check>}) {
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
export function SidePanelChecks(props: RouterProps & OptionalPanelProps) {
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