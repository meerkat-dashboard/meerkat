import { h, Fragment } from 'preact';
import { route } from 'preact-router';
import { useEffect, useReducer, useState } from 'preact/hooks';

import * as meerkat from './meerkat'
import { routeParam, removeParam, TagEditor } from './util';
import { CheckCard, CheckCardOptions } from './elements/card';
import { CheckSVG, CheckSVGOptions, CheckSVGDefaults } from './elements/svg';
import { CheckImage, CheckImageOptions } from './elements/image';
import { StaticText, StaticTextOptions, StaticTextDefaults } from './statics/text';
import { StaticSVG, StaticSVGOptions, StaticSVGDefaults } from './statics/svg';
import { StaticImage, StaticImageOptions } from './statics/image';

//Manage dashboard state
const dashboardReducer = (state, action) => {
	switch (action.type) {
		case 'setDashboard':
			return action.dashboard;
		case 'setTitle':
			console.log('Setting title to ' + action.title)
			return {...state, title: action.title};
		case 'setTags':
			console.log(`Setting tags to ${action.tags}`);
			return {...state, tags: action.tags};
		case 'setBackground':
			console.log('Setting background to ' + action.background)
			return {...state, background: action.background};
		case 'addElement':
			console.log('Adding new element')
			const newElement = {
				type: 'check-card',
				title: 'New Element',
				rect:{ x: 0, y: 0, w: 15, h: 15},
				options: {
					checkId: null,
					nameFontSize: 40,
					statusFontSize: 60
				}
			};
			return {
				...state,
				elements: state.elements.concat(newElement)
			};
		case 'updateElement':
			console.log('Updating element')
			const newState = {...state};
			newState.elements[action.elementIndex] = action.element;
			return newState;
		case 'reorderElements':
			console.log('Reordering elements')
			const ns = {...state};

			const element = ns.elements[action.sourcePosition];
			ns.elements.splice(action.sourcePosition, 1);
			ns.elements.splice(action.destinationPosition, 0, element);

			return ns;
		default: throw new Error(`Unexpected action`);
	}
};

//Edit page
export function Editor({slug, selectedElementId}) {
	const [dashboard, dashboardDispatch] =  useReducer(dashboardReducer, null);
	const [savingDashboard, setSavingDashboard] = useState(false);
	const [highlightedElementId, setHighlightedElementId] = useState(null);

	useEffect(() => {
		meerkat.getDashboard(slug).then(async d => {
			dashboardDispatch({ type: 'setDashboard', dashboard: d });
		});
	}, [slug]);

	if(dashboard === null) {
		return <div class="loading center subtle">Loading dashboard</div>
	}

	const selectedElement = selectedElementId ? dashboard.elements[selectedElementId] : null;
	if(typeof selectedElement === 'undefined') {
		removeParam('selectedElementId');
		return
	}
	const updateElement = element => {
		dashboardDispatch({
			type: 'updateElement',
			elementIndex: selectedElementId,
			element: element
		});
	}

	const saveDashboard = async e => {
		setSavingDashboard(true);
		console.log(dashboard);
		try {
			const data = await meerkat.saveDashboard(slug, dashboard);
			route(`/edit/${data.slug}${window.location.search}`)
			//TODO show success
		} catch (e) {
			//TODO improve
			console.log('error saving dashboard:');
			console.log(e);
		}
		setSavingDashboard(false);
	}

	return <Fragment>
		<DashboardView dashboard={dashboard} dashboardDispatch={dashboardDispatch}
			selectedElementId={selectedElementId ? Number(selectedElementId) : null}
			highlightedElementId={highlightedElementId} />

		<div class="editor">
			<div class="options">
				<h3>{dashboard.title}</h3>
				<SidePanelSettings dashboard={dashboard} dashboardDispatch={dashboardDispatch} />
				<hr />
				<SidePanelElements dashboard={dashboard} dashboardDispatch={dashboardDispatch}
					setHighlightedElementId={setHighlightedElementId} />

				<ElementSettings selectedElement={selectedElement} updateElement={updateElement} />
			</div>
		</div>
		<div class="side-bar-footer lefty-righty">
			<button class="hollow" onClick={e => route('/')}>Home</button>
			<button onClick={saveDashboard} class={ savingDashboard ? 'loading' : ''}>Save Dashboard</button>
		</div>
	</Fragment>
}

function TransformableElement({rect, updateRect, children, glow, highlight}) {
	//Handle dragging elements
	const handleMove = downEvent => {
		const mousemove = moveEvent => {
			const elementNode = downEvent.target;
			const dashboardNode = elementNode.parentElement;
	
			//Get max dimensions
			let left = elementNode.offsetLeft + moveEvent.movementX;
			let top = elementNode.offsetTop + moveEvent.movementY;
			const maxLeft = dashboardNode.clientWidth - elementNode.clientWidth;
			const maxTop = dashboardNode.clientHeight - elementNode.clientHeight;

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
			const elementNode = downEvent.target.parentElement;
			const dashboardNode = elementNode.parentElement;
	
			//Get max dimensions
			let width = elementNode.clientWidth + moveEvent.movementX;
			let height = elementNode.clientHeight + moveEvent.movementY;
			let maxWidth = dashboardNode.clientWidth - elementNode.offsetLeft;
			let maxHeight = dashboardNode.clientHeight - elementNode.offsetTop;

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

	return <div class={`check ${glow || highlight ? 'glow' : ''}`}
		style={{left: left, top: top, width: width, height: height}}
		onMouseDown={handleMove}>
			{children}
			<div class="resize" onMouseDown={handleResize}></div>
	</div>
}

function DashboardElements({dashboardDispatch, selectedElementId, elements, highlightedElementId}) {
	return elements.map((element, index) => {
		const updateRect = rect => {
			dashboardDispatch({
				type: 'updateElement',
				elementIndex: index,
				element: {
					...element,
					rect: rect
				}
			});
		}

		let ele = null;
		if(element.type === 'check-card') { ele = <CheckCard options={element.options} /> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options}/> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }

		return <TransformableElement rect={element.rect} updateRect={updateRect}
			glow={selectedElementId === index} highlight={highlightedElementId === index}>
			{ele}
		</TransformableElement>
	});
}

//The actual dashboard being rendered
function DashboardView({dashboard, dashboardDispatch, selectedElementId, highlightedElementId}) {
	const backgroundImage = dashboard.background ? `url(${dashboard.background})` : 'none';

	return <div class="dashboard-wrap">
		<div class="dashboard" style={{backgroundImage: backgroundImage}}>
			<DashboardElements elements={dashboard.elements} selectedElementId={selectedElementId}
				dashboardDispatch={dashboardDispatch} highlightedElementId={highlightedElementId}/>
		</div>
	</div>
}

//Settings view for the sidebar
function SidePanelSettings({dashboardDispatch, dashboard}) {
	const handleBackgroundImg = async e => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			
			dashboardDispatch({
				type: 'setBackground',
				background: res.url
			});
		} catch (e) {
			//TODO improve
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	const updateTags = tags => {
		dashboardDispatch({
			type: 'setTags',
			tags: tags.map(v => v.toLowerCase().trim())
		});
	}

	const clearBackground = e => {
		e.preventDefault();
		dashboardDispatch({
			type: 'setBackground',
			background: null
		});
	}

	const imgControls = src => {
		if(src) {
			return <Fragment>
				<a onClick={clearBackground}>clear</a>&nbsp;
				<a target="_blank" href={src}>view</a>
			</Fragment>
		}
		return null;
	}

	return <Fragment>
		<label for="title">Title</label>
		<input type="text" id="title" placeholder="Network Overview" value={dashboard.title}
			onInput={e => dashboardDispatch({type: 'setTitle', title: e.currentTarget.value})} />

		<TagEditor tags={dashboard.tags} updateTags={tags => updateTags(tags)} />
	
		<label for="background-image">Background Image {imgControls(dashboard.background)}</label>
		<input id="background-image" type="file" placeholder="Upload a background image"
			accept="image/*" onChange={handleBackgroundImg}/>
	</Fragment>
}

function SidePanelElements({dashboard, dashboardDispatch, setHighlightedElementId}) {
	const addElement = e => {
		const newId = dashboard.elements.length;
		dashboardDispatch({type: 'addElement'});
		routeParam('selectedElementId', newId);
	}

	const handleDragStart = e => {
		e.dataTransfer.setData("source-id", e.target.id);
	}

	const handleDrop = e => {
		e.preventDefault();
		e.currentTarget.classList.remove('active');
		const sourceId = e.dataTransfer.getData("source-id");
		const destId = e.target.id;
		dashboardDispatch({
			type: 'reorderElements',
			sourcePosition: sourceId,
			destinationPosition: destId
		});
	}

	let elementList = dashboard.elements.map((element, index) => (
		<div class="element-item" draggable={true} id={index} onDragStart={handleDragStart}
			onClick={ e => routeParam('selectedElementId', index.toString()) }
			onMouseEnter={e => {e.stopPropagation(); setHighlightedElementId(index)}}
			onMouseLeave={e => {e.stopPropagation(); setHighlightedElementId(null)}}>
			<div class="element-title">{element.title}</div>
			<div class="drop-zone" onDrop={handleDrop} id={index}
				onDragEnter={e => {e.preventDefault(); e.currentTarget.classList.add('active')}}
				onDragOver={e => e.preventDefault()}
				onDragExit={e => e.currentTarget.classList.remove('active')}></div>
		</div>
	));

	if(elementList.length < 1) { elementList = <div class="subtle">No elements added.</div>}

	return <Fragment>
		<div class="lefty-righty spacer">
			<h3>Elements</h3>
			<button class="small hollow" onClick={addElement}>New</button>
		</div>
		<div class="element-list">
			{elementList}
		</div>
	</Fragment>
}

export function ElementSettings({selectedElement, updateElement}) {
	if(selectedElement === null) {
		return null;
	}

	const updateElementOptions = (options) => {
		const newOptions = Object.assign(selectedElement.options, options)
		updateElement({...selectedElement, options: newOptions})
	}

	//sets good default values for each visial type when they're selected
	const updateType = e => {
		const newType = e.currentTarget.value
		let defaults = {};
		switch(newType) {
			case 'check-svg': defaults = CheckSVGDefaults; break;
			case 'static-text': defaults = StaticTextDefaults; break;
			case 'static-svg': defaults = StaticSVGDefaults; break;
		}

		updateElement({
			...selectedElement,
			type: newType,
			options: Object.assign(selectedElement.options, defaults)
		});
	}

	let ElementOptions = null;
	if(selectedElement.type === 'check-card') { ElementOptions = <CheckCardOptions updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if(selectedElement.type === 'check-svg') { ElementOptions = <CheckSVGOptions updateOptions={updateElementOptions} options={selectedElement.options}/> }
	if(selectedElement.type === 'check-image') { ElementOptions = <CheckImageOptions updateOptions={updateElementOptions} options={selectedElement.options}/> }
	if(selectedElement.type === 'static-text') { ElementOptions = <StaticTextOptions updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if(selectedElement.type === 'static-svg') { ElementOptions = <StaticSVGOptions updateOptions={updateElementOptions} options={selectedElement.options}/> }
	if(selectedElement.type === 'static-image') { ElementOptions = <StaticImageOptions updateOptions={updateElementOptions} options={selectedElement.options}/> }

	return <div class="editor settings-overlay">
		<div class="options">
			<div class="lefty-righty spacer">
				<h3 class="no-margin">{selectedElement.title}</h3>
				<svg class="feather" onClick={e => removeParam('selectedElementId')}>
					<use xlinkHref={`/res/svgs/feather-sprite.svg#x`}/>
				</svg>
			</div>
			<div class="settings">
				<label for="name">Name</label>
				<input id="name" type="text" placeholder="Cool Element" value={selectedElement.title}
					onInput={e => updateElement({...selectedElement, title: e.currentTarget.value})} />

				<label>Visual Type</label>
				<select name="item-type" value={selectedElement.type} onInput={updateType}>
					<option value="check-card">Icinga Card</option>
					<option value="check-svg">Icinga SVG</option>
					<option value="check-image">Icinga Image</option>
					<option value="static-text">Static Text</option>
					<option value="static-svg">Static SVG</option>
					<option value="static-image">Static Image</option>
				</select>
				<hr />

				{ElementOptions}
			</div>
		</div>
	</div>
}