import { h, Fragment } from 'preact';
import { RouterProps, route, RoutableProps } from 'preact-router';
import { useState, useEffect, StateUpdater } from 'preact/hooks';

import { routeParam } from './util';
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

interface EditorProps {
	view?: string;
	id?: string;
}

function newDashboard(): Dashboard {
	return {
		title: 'New Dashboard',
		checks: []
	}
};

//Edit page
export function Editor(props: RouterProps & EditorProps) {
	const [dashboard, setDashboard] = useState(newDashboard());

	const updateDashboard = (diff: Partial<Dashboard>) => {
		setDashboard({
			...dashboard,
			...diff
		});
	}

	const selectedElement = props.id ? Number(props.id) : null;

	let view = <DashboardSettings dashboard={dashboard} updateDashboard={updateDashboard} selectedElement={selectedElement} />
	if(props.view === 'checks') {
		view = <DashboardChecks dashboard={dashboard} updateDashboard={updateDashboard} selectedElement={selectedElement} />
	}
	if(props.view === 'statics') {
		view = <DashboardStatics dashboard={dashboard} updateDashboard={updateDashboard} selectedElement={selectedElement} />
	}

	return <Fragment>
		<DashboardView dashboard={dashboard} />

		<div class="editor">
			<div class="icons">
				<OptionLink icon="settings" href="/edit/settings" label="settings" />
				<OptionLink icon="activity" href="/edit/checks" label="checks" />
				<OptionLink icon="image" href="/edit/statics" label="statics" />
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

interface optionalPanelProps {
	dashboard: Dashboard;
	updateDashboard: (diff: Partial<Dashboard>) => void;
	selectedElement: number | null;
}

export interface Check {
	type: string;
	rect: Rect;
}

//get rekt
interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

function TransformableElement(props: {rect: Rect} & {children: any}) { //TODO children any
	const [moving, setMoving] = useState(false);

	const mouseMove = e => {
		console.log(e);
		e.currentTarget.style.marginLeft = `${e.x}`;
	}

	return <div class="check card"
		style={{marginLeft: props.rect.x, marginTop: props.rect.y, width: props.rect.w, height: props.rect.h}}
		onMouseMove={mouseMove}>
			{props.children}
	</div>
}

//The actual dashboard being rendered
function DashboardView(props: RouterProps & {dashboard: Dashboard}) {
	const checks = props.dashboard.checks.map(check => {
		let element = <CardElement check={check} />
		if(check.type === 'svg') {
			element = <div> todo </div>
		}
		if(check.type === 'image') {
			element = <div> todo </div>
		}

		return <TransformableElement rect={check.rect}>
			{element}
		</TransformableElement>
	});

	return <div class="dashboard-wrap">
		<h2>{props.dashboard.title}</h2>
		<div class="dashboard">
			{checks}
		</div>
	</div>
}

//Settings view for the sidebar
function DashboardSettings(props: RouterProps & optionalPanelProps) {
	return <Fragment>
		<h3>Settings</h3>
		<label for="title">Title</label>
		<input type="text" id="title" placeholder="Network Overview"
			value={props.dashboard.title} onInput={e => props.updateDashboard({title: e.currentTarget.value})} />
	</Fragment>
}

//Checks view for the sidebar
function DashboardChecks(props: RouterProps & optionalPanelProps) {
	const addCheck = () => {
		const newChecks = props.dashboard.checks.concat({
			type: 'card',
			rect: {
				x: 0,
				y: 0,
				w: 100,
				h: 100
			}
		});
		props.updateDashboard({
			checks: newChecks
		});

		routeParam('id', (newChecks.length-1).toString());
	}

	return <Fragment>
		<div class="lefty-righty" style="margin-bottom: 20px;">
			<h3>Checks</h3>
			<button class="small" onClick={addCheck}>New</button>
		</div>
		{ props.selectedElement === null ?
			<div class="subtle" style="flex-direction: column; font-size: 16px;">
				<div>No checks added.</div>
				<a onClick={addCheck}>Create one</a>
			</div>
			:
			<Fragment>
			<label>Visual Type</label>
			<select name="item-type">
				<option value="card">Card</option>
				<option value="svg">SVG</option>
				<option value="image">Image</option>
			</select>
			</Fragment>
		}
	</Fragment>
}

//Statics view for the sidebar
function DashboardStatics(props: RouterProps & optionalPanelProps) {
	return <Fragment>
		<h3>Static Content</h3>
		<select>
			<option value="item-type">Card</option>
			<option value="item-type">SVG</option>
			<option value="item-type">Image</option>
		</select>
	</Fragment>
}