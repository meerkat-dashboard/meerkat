import { h, Fragment, JSX } from 'preact';
import { RouterProps, route, RoutableProps } from 'preact-router';
import { useState, useEffect, StateUpdater, useReducer } from 'preact/hooks';

import { SidePanelChecks } from './side-panel-checks';
import { CardElement } from './elements/check';

interface OptionLinkProps {
	icon: string;
	href: string;
	label: string;
}

const OptionLink = (props: OptionLinkProps) => {
	//url with no params
	const currentURL = window.location.pathname;
	
	return <div class={`icon-wraps ${props.href === currentURL ? 'active' : ''}`}
			tabIndex={0} onClick={() => route(props.href)}>
		<svg class="feather">
			<use xlinkHref={`/res/svgs/feather-sprite.svg#${props.icon}`}/>
		</svg>
		<div class="label">{props.label}</div>
	</div>
}

const initialDashboard: Dashboard = {
	title: 'New Dashboard',
	checks: []
};

type DashboardAction = {
		type: "setTitle"
		title: string;
	} | {
		type: "addCheck"
	} | {
		type: "updateCheck"
		checkIndex: number
		check: Check
};

//Manage dashboard state
const dashboardReducer = (state: Dashboard, action: DashboardAction) => {
	switch (action.type) {
		case 'setTitle':
			console.log('Setting title to ' + action.title)
			return {...state, title: action.title};
		case 'addCheck':
			console.log('Adding new check')
			const newCheck: Check = {type: 'card', title: 'New Check', rect:{ x: 0, y: 0, w: 100, h: 100}};
			return {
				...state,
				checks: state.checks.concat(newCheck)
			};
		case 'updateCheck':
			console.log('Updating check')
			const newState = {...state};
			newState.checks[action.checkIndex] = action.check;
			return newState;
		default: throw new Error(`Unexpected action`);
	}
};

interface EditorProps {
	view?: string;
	id?: string;
}

//Edit page
export function Editor(props: RouterProps & EditorProps) {
	const [dashboard, dashboardDispatch] =  useReducer(dashboardReducer, initialDashboard);

	const selectedElement = props.id ? Number(props.id) : null;

	let view = <SidePanelSettings dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	if(props.view === 'checks') {
		view = <SidePanelChecks dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	}
	if(props.view === 'statics') {
		view = <SidePanelStatics dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	}

	return <Fragment>
		<DashboardView dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />

		<div class="editor">
			<div class="icons">
				<OptionLink icon="settings" href="/edit/settings" label="settings" />
				<OptionLink icon="activity" href="/edit/checks" label="checks" />
				<OptionLink icon="image" href="/edit/statics" label="statics" />

				<OptionLink icon="home" href="/" label="home" />
			</div>
			<div class="options">
				{view}
			</div>
		</div>
	</Fragment>
}

interface Dashboard {
	title: string;
	checks: Array<Check>
}

export interface OptionalPanelProps {
	dashboard: Dashboard;
	dashboardDispatch: (action: DashboardAction) => void;
	selectedElement: number | null;
}

export interface Check {
	type: 'card' | 'image' | 'svg';
	title: string;
	rect: Rect;
}

//get rekt
interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

function TransformableElement(props: {rect: Rect, updateRect: (rect: Rect) => void} & JSX.ElementChildrenAttribute) {
	//Handle dragging elements
	const handleMove = downEvent => {
		const mousemove = moveEvent => {
			const ele = downEvent.target;
	
			//Get max dimensions
			let left = ele.offsetLeft + moveEvent.movementX;
			let top = ele.offsetTop + moveEvent.movementY;
			const maxLeft = ele.parentElement.clientWidth - ele.clientWidth;
			const maxTop = ele.parentElement.clientHeight - ele.clientHeight;

			//limit movement to max dimensions
			left = left < 0 ? 0 : left;
			left = left > maxLeft ? maxLeft : left;
			top = top < 0 ? 0 : top;
			top = top > maxTop ? maxTop : top;

			//set position
			props.updateRect({x: left, y: top, w: props.rect.w, h: props.rect.h});
		}

		//Remove listeners on mouse button up
		const mouseup = () => {
			window.removeEventListener('mousemove', mousemove);
			window.removeEventListener('mouseup', mouseup);
		}

		//Add movement and mouseup events
		window.addEventListener('mouseup', mouseup);
		window.addEventListener('mousemove', mousemove);
	}

	const handleResize = downEvent => {
		downEvent.stopPropagation();

		const mousemove = moveEvent => {
			const ele = downEvent.target;
	
			//Get max dimensions
			let width = ele.parentElement.clientWidth + moveEvent.movementX;
			let height = ele.parentElement.clientHeight + moveEvent.movementY;

			//TODO don't allow resize over dashboard borders

			//limit minimun resize
			width = width < 100 ? 100 : width;
			height = height < 100 ? 100 : height;

			//set position
			props.updateRect({x: props.rect.x, y: props.rect.y, w: width, h: height});
		}

		//Remove listeners on mouse button up
		const mouseup = () => {
			window.removeEventListener('mousemove', mousemove);
			window.removeEventListener('mouseup', mouseup);
		}

		//Add movement and mouseup events
		window.addEventListener('mouseup', mouseup);
		window.addEventListener('mousemove', mousemove);
	}

	return <div class="check"
		style={{left: props.rect.x, top: props.rect.y, width: props.rect.w, height: props.rect.h}}
		onMouseDown={handleMove}>
			{props.children}
			<div class="resize" onMouseDown={handleResize}></div>
	</div>
}

//The actual dashboard being rendered
function DashboardView(props: RouterProps & OptionalPanelProps) {
	const checks = props.dashboard.checks.map((check, index) => {
		const updateRect = rect => {
			props.dashboardDispatch({
				type: 'updateCheck',
				checkIndex: index,
				check: {
					...check,
					rect: rect
				}
			});
		}

		let element = <CardElement check={check} />
		if(check.type === 'svg') {
			element = <div> todo </div>
		}
		if(check.type === 'image') {
			element = <div> todo </div>
		}

		return <TransformableElement rect={check.rect} updateRect={updateRect}>
			{element}
		</TransformableElement>
	});

	const saveDashboard = e => {
		console.log(props.dashboard);
	}

	return <div class="dashboard-wrap">
		<div class="lefty-righty" style="margin-bottom: 20px;">
			<h2>{props.dashboard.title}</h2>
			<button onClick={saveDashboard}>Save Dashboard</button>
		</div>
		<div class="dashboard">
			{checks}
		</div>
	</div>
}

//Settings view for the sidebar
function SidePanelSettings(props: RouterProps & OptionalPanelProps) {
	return <Fragment>
		<h3>Settings</h3>
		<label for="title">Title</label>
		<input type="text" id="title" placeholder="Network Overview" value={props.dashboard.title}
			onInput={e => props.dashboardDispatch({type: 'setTitle', title: e.currentTarget.value})} />
	</Fragment>
}

//Statics view for the sidebar
function SidePanelStatics(props: RouterProps & OptionalPanelProps) {
	return <Fragment>
		<h3>Static Content</h3>
		<select>
			<option value="item-type">Card</option>
			<option value="item-type">SVG</option>
			<option value="item-type">Image</option>
		</select>
	</Fragment>
}