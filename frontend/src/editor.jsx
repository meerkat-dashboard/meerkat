import { h, Fragment } from 'preact';
import { route } from 'preact-router';
import { useEffect, useReducer } from 'preact/hooks';

import { SidePanelChecks, CheckSettings } from './check-settings';
import { SidePanelStatics, StaticSettings } from './static-settings';
import { CardElement } from './elements/card';
import { removeParam } from './util';

import { StaticText } from './statics/text';

//Manage dashboard state
const dashboardReducer = (state, action) => {
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
			const newCheck = {
				type: 'card',
				title: 'New Check',
				checkID: null,
				rect:{ x: 0, y: 0, w: 15, h: 15},
				options: {
					nameFontSize: 40,
					statusFontSize: 60
				}
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
		case 'addStatic':
			console.log('Adding new static')
			const newStatic = {
				type: 'text',
				title: 'New text',
				rect:{ x: 0, y: 0, w: 15, h: 15},
				options: {
					fontSize: 40
				}
			};
			return {
				...state,
				statics: state.statics.concat(newStatic)
			};
		case 'updateStatic':
			console.log('Updating static')
			const ns = {...state};
			ns.statics[action.staticIndex] = action.static;
			return ns;
		default: throw new Error(`Unexpected action`);
	}
};

//Edit page
export function Editor({slug, selectedCheckId, selectedStaticId}) {
	const [dashboard, dashboardDispatch] =  useReducer(dashboardReducer, null);

	useEffect(() => {
		//TODO error handling
		fetch(`/dashboard/${slug}`)
			.then(async res => dashboardDispatch({
				type: 'setDashboard',
				dashboard: await res.json()
			}));
	}, [slug]);

	if(dashboard === null) {
		return <div class="loading center subtle">Loading dashboard</div>
	}

	const selectedCheck = selectedCheckId ? dashboard.checks[selectedCheckId] : null;
	if(typeof selectedCheck === 'undefined') {
		removeParam('selectedCheckId');
		return
	}
	const updateCheck = check => {
		dashboardDispatch({
			type: 'updateCheck',
			checkIndex: selectedCheckId,
			check: check
		});
	}

	const selectedStatic = selectedStaticId ? dashboard.statics[selectedStaticId] : null;
	if(typeof selectedStatic === 'undefined') {
		removeParam('selectedStaticId');
		return
	}
	const updateStatic = s => {
		dashboardDispatch({
			type: 'updateStatic',
			staticIndex: selectedStaticId,
			static: s
		});
	}

	return <Fragment>
		<DashboardView slug={slug} dashboard={dashboard} dashboardDispatch={dashboardDispatch}
			selectedCheckId={selectedCheckId ? Number(selectedCheckId) : null}
			selectedStaticId={selectedStaticId ? Number(selectedStaticId) : null} />

		<div class="editor">
			<div class="options">
				<div class="lefty-righty spacer">
					<h3 class="no-margin">{dashboard.title}</h3>
					<svg class="feather" onClick={e => route('/')}>
						<use xlinkHref={`/res/svgs/feather-sprite.svg#home`}/>
					</svg>
				</div>
				<SidePanelSettings dashboard={dashboard} dashboardDispatch={dashboardDispatch} />
				<hr />
				<SidePanelChecks dashboard={dashboard} dashboardDispatch={dashboardDispatch} />
				<hr />
				<SidePanelStatics dashboard={dashboard} dashboardDispatch={dashboardDispatch} />

				<CheckSettings selectedCheck={selectedCheck} updateCheck={updateCheck}/>
				<StaticSettings selectedStatic={selectedStatic} updateStatic={updateStatic}/>
			</div>
		</div>
	</Fragment>
}

function TransformableElement({rect, updateRect, children, glow}) {
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
			updateRect({x: relativeLeft, y: relativeTop, w: rect.w, h: rect.h});
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
			height = height < 50 ? 50 : height;
			height = height < maxHeight ? height : maxHeight;
			
			//convert dimensions to relative (px -> percentage based)
			const relativeWidth = width / dashboardNode.clientWidth * 100;
			const relativeHeight = height / dashboardNode.clientHeight * 100;

			//set position
			updateRect({x: rect.x, y: rect.y, w: relativeWidth, h: relativeHeight});
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

	const left = `${rect.x}%`;
	const top = `${rect.y}%`;
	const width = `${rect.w}%`;
	const height = `${rect.h}%`;

	return <div class={`check ${glow ? 'glow' : ''}`}
		style={{left: left, top: top, width: width, height: height}}
		onMouseDown={handleMove}>
			{children}
			<div class="resize" onMouseDown={handleResize}></div>
	</div>
}

function DashboardChecks({dashboardDispatch, selectedCheckId, checks}) {
	return checks.map((check, index) => {
		const updateRect = rect => {
			dashboardDispatch({
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

		return <TransformableElement rect={check.rect} updateRect={updateRect}
			glow={selectedCheckId === index}>
			{element}
		</TransformableElement>
	});
}

function DashboardStatics({dashboardDispatch, selectedStaticId, statics}) {
	return statics.map((static_, index) => {
		const updateRect = rect => {
			dashboardDispatch({
				type: 'updateStatic',
				staticIndex: index,
				static: {
					...static_,
					rect: rect
				}
			});
		}

		let element = null;
		if(static_.type === 'text') { element = <StaticText options={static_.options}/> }

		return <TransformableElement rect={static_.rect} updateRect={updateRect}
			glow={selectedStaticId === index}>
			{element}
		</TransformableElement>
	});
}

//The actual dashboard being rendered
function DashboardView({dashboard, dashboardDispatch, selectedCheckId, selectedStaticId, slug}) {
	const saveDashboard = async e => {
		console.log(dashboard);
		try {
			const data = await fetch(`/dashboard/${slug}`, {
				method: 'POST',
				body: JSON.stringify(dashboard)
			}).then(res => res.json());

			route(`/edit/${data.slug}`)
			//TODO show success
		} catch (e) {
			//TODO improve
			console.log('error saving dashboard:');
			console.log(e);
		}
	}

	const backgroundImage = dashboard.background ? `url(${dashboard.background})` : 'none';

	return <div class="dashboard-wrap">
		<div class="right spacer">
			<button onClick={saveDashboard}>Save Dashboard</button>
		</div>
		<div class="dashboard" style={{backgroundImage: backgroundImage}}>
			<DashboardStatics statics={dashboard.statics} selectedStaticId={selectedStaticId}
				dashboardDispatch={dashboardDispatch} />
			<DashboardChecks checks={dashboard.checks} selectedCheckId={selectedCheckId}
				dashboardDispatch={dashboardDispatch} />
		</div>
	</div>
}

//Settings view for the sidebar
function SidePanelSettings({dashboardDispatch, dashboard}) {
	const handleBackgroundImg = async e => {
		try {
			const data = await fetch('/upload', {
				headers: {
					"filename": e.target.files[0].name
				},
				method: 'POST',
				body: e.target.files[0]
			}).then(res => res.json());
			
			dashboardDispatch({
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
		<label for="title">Title</label>
		<input type="text" id="title" placeholder="Network Overview" value={dashboard.title}
			onInput={e => dashboardDispatch({type: 'setTitle', title: e.currentTarget.value})} />

		<label for="background-image">Background Image</label>
		<input id="background-image" type="file" placeholder="Upload a background image"
			accept="image/*" onChange={handleBackgroundImg}/>
	</Fragment>
}