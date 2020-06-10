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

type DashboardAction = {
		type: "setDashboard"
		dashboard: Dashboard;
	} | {
		type: "setTitle"
		title: string;
	} | {
		type: "setBackground"
		background?: string;
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
		case 'setDashboard':
			return action.dashboard;
		case 'setTitle':
			console.log('Setting title to ' + action.title)
			return {...state, title: action.title};
		case 'setBackground':
			console.log('Setting background to ' + action.background)
			return {...state, background: action.background};
		case 'addCheck':
			console.log('Adding new check')
			const newCheck: Check = {
				type: 'card',
				title: 'New Check',
				checkID: null,
				rect:{ x: 0, y: 0, w: 15, h: 15}
			};
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
	slug?: string;
	view?: string;
	id?: string;
}

//Edit page
export function Editor(props: RouterProps & EditorProps) {
	const [dashboard, dashboardDispatch] =  useReducer(dashboardReducer, null);

	useEffect(() => {
		//TODO error handling
		fetch(`/dashboard/${props.slug}`)
			.then(async res => dashboardDispatch({
				type: 'setDashboard',
				dashboard: await res.json()
			}));
	}, [props.slug]);

	if(dashboard === null) {
		return <div class="loading center subtle">Loading dashboard</div>
	}

	const selectedElement = props.id ? Number(props.id) : null;

	let view = <SidePanelSettings dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	if(props.view === 'checks') {
		view = <SidePanelChecks dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	}
	if(props.view === 'statics') {
		view = <SidePanelStatics dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />
	}

	return <Fragment>
		<DashboardView slug={props.slug} view={props.view} dashboard={dashboard} dashboardDispatch={dashboardDispatch} selectedElement={selectedElement} />

		<div class="editor">
			<div class="icons">
				<OptionLink icon="settings" href={`/edit/${props.slug}/settings`} label="settings" />
				<OptionLink icon="activity" href={`/edit/${props.slug}/checks`} label="checks" />
				<OptionLink icon="image" href={`/edit/${props.slug}/statics`} label="statics" />

				<OptionLink icon="home" href="/" label="home" />
			</div>
			<div class="options">
				{view}
			</div>
		</div>
	</Fragment>
}

export interface Dashboard {
	title: string;
	background?: string;
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
	checkID?: string;
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
			const checkNode = downEvent.target;
			const dashboardNode = checkNode.parentElement;
	
			//Get max dimensions
			let left = checkNode.offsetLeft + moveEvent.movementX;
			let top = checkNode.offsetTop + moveEvent.movementY;
			const maxLeft = dashboardNode.clientWidth - checkNode.clientWidth;
			const maxTop = dashboardNode.clientHeight - checkNode.clientHeight;

			//limit movement to max dimensions
			left = left < 0 ? 0 : left;
			left = left > maxLeft ? maxLeft : left;
			top = top < 0 ? 0 : top;
			top = top > maxTop ? maxTop : top;

			//convert dimensions to relative (px -> percentage based)
			const relativeLeft = left / dashboardNode.clientWidth * 100;
			const relativeTop = top / dashboardNode.clientHeight * 100;

			//set position
			props.updateRect({x: relativeLeft, y: relativeTop, w: props.rect.w, h: props.rect.h});
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
			//Go up an element due to resize dot
			const checkNode = downEvent.target.parentElement;
			const dashboardNode = checkNode.parentElement;
	
			//Get max dimensions
			let width = checkNode.clientWidth + moveEvent.movementX;
			let height = checkNode.clientHeight + moveEvent.movementY;
			let maxWidth = dashboardNode.clientWidth - checkNode.offsetLeft;
			let maxHeight = dashboardNode.clientHeight - checkNode.offsetTop;

			//limit minimun resize
			width = width < 100 ? 100 : width;
			width = width < maxWidth ? width : maxWidth;
			height = height < 100 ? 100 : height;
			height = height < maxHeight ? height : maxHeight;
			
			//convert dimensions to relative (px -> percentage based)
			const relativeWidth = width / dashboardNode.clientWidth * 100;
			const relativeHeight = height / dashboardNode.clientHeight * 100;

			//set position
			props.updateRect({x: props.rect.x, y: props.rect.y, w: relativeWidth, h: relativeHeight});
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

	const left = `${props.rect.x}%`;
	const top = `${props.rect.y}%`;
	const width = `${props.rect.w}%`;
	const height = `${props.rect.h}%`;

	return <div class="check"
		style={{left: left, top: top, width: width, height: height}}
		onMouseDown={handleMove}>
			{props.children}
			<div class="resize" onMouseDown={handleResize}></div>
	</div>
}

//The actual dashboard being rendered
function DashboardView(props: {slug: string, view: string} & RouterProps & OptionalPanelProps) {
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

	const saveDashboard = async e => {
		console.log(props.dashboard);
		try {
			const data = await fetch(`/dashboard/${props.slug}`, {
				method: 'POST',
				body: JSON.stringify(props.dashboard)
			}).then(res => res.json());

			route(`/edit/${data.slug}/${props.view}`)
			//TODO show success
		} catch (e) {
			//TODO improve
			console.log('error saving dashboard:');
			console.log(e);
		}
	}

	const backgroundImage = props.dashboard.background ? `url(${props.dashboard.background})` : 'none';

	return <div class="dashboard-wrap">
		<div class="lefty-righty" style="margin-bottom: 20px;">
			<h2>{props.dashboard.title}</h2>
			<button onClick={saveDashboard}>Save Dashboard</button>
		</div>
		<div class="dashboard" style={{backgroundImage: backgroundImage}}>
			{checks}
		</div>
	</div>
}

//Settings view for the sidebar
function SidePanelSettings(props: RouterProps & OptionalPanelProps) {
	const handleBackgroundImg = async e => {
		try {
			const data = await fetch('/upload', {
				headers: {
					"filename": e.target.files[0].name
				},
				method: 'POST',
				body: e.target.files[0]
			}).then(res => res.json());
			
			props.dashboardDispatch({
				type: 'setBackground',
				background: '/' + data.url
			});
		} catch (e) {
			//TODO improve
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	return <Fragment>
		<h3>Settings</h3>
		<label for="title">Title</label>
		<input type="text" id="title" placeholder="Network Overview" value={props.dashboard.title}
			onInput={e => props.dashboardDispatch({type: 'setTitle', title: e.currentTarget.value})} />

		<label for="background-image">Background Image</label>
		<input id="background-image" type="file" placeholder="Upload a background image"
			accept="image/*" onChange={handleBackgroundImg} />
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