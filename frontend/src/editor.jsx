import { h, Fragment } from 'preact';
import { route } from 'preact-router';
import { useEffect, useReducer, useState, useRef, useLayoutEffect } from 'preact/hooks';

import * as meerkat from './meerkat'
import { routeParam, removeParam, TagEditor } from './util';
import { CheckCard, CheckCardOptions } from './elements/card';
import { CheckSVG, CheckSVGOptions, CheckSVGDefaults } from './elements/svg';
import { CheckImage, CheckImageOptions } from './elements/image';
import { CheckLine, CheckLineOptions, CheckLineDefaults } from './elements/line';
import { StaticText, StaticTextOptions, StaticTextDefaults } from './statics/text';
import { StaticSVG, StaticSVGOptions, StaticSVGDefaults } from './statics/svg';
import { StaticImage, StaticImageOptions } from './statics/image';
import { IframeVideo, IframeVideoOptions } from './elements/video';
import { AudioStream, AudioOptions } from './elements/audio';

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
		case 'setGlobalOk':
			return {...state, okSound: action.okSound};
		case 'setGlobalCritical':
			return {...state, criticalSound: action.criticalSound};
		case 'setGlobalWarning':
			return {...state, warningSound: action.warningSound};	
		case 'setGlobalUnknown':
			return {...state, unknownSound: action.unknownSound};	
		case 'setBackground':
			console.log('Setting background to ' + action.background)
			return {...state, background: action.background};
		case 'setGlobalMute':
			return {...state, globalMute: action.globalMute};
		case 'addElement':
			console.log('Adding new element')
			const newElement = {
				type: 'check-card',
				title: 'New Element',
				rect:{ x: 0, y: 0, w: 15, h: 12},
				options: {
					objectType: null,
					filter: null,
					selection: "",
					nameFontSize: 40,
					statusFontSize: 60,
					muteAlerts: false,
				}
			};
			return {
				...state,
				elements: state.elements.concat(newElement)
			};
		case 'deleteElement':
			console.log('Deleting element')
			const nstate = {...state};
			nstate.elements.splice(action.index, 1);
			return nstate;
		case 'duplicateElement':
			console.log('Duplicating element')
			return {
				...state,
				elements: state.elements.concat(JSON.parse(JSON.stringify(action.element)))
			};
		case 'getDimensions' :
			console.log('Getting Dimensions')
			return {...state, height: action.height, width: action.width};
		case 'updateElement':
			console.log(`Updating element: ${JSON.stringify([action.elementIndex, action.element])}`)
			const newState = {...state};
			newState.elements[action.elementIndex] = JSON.parse(JSON.stringify(action.element));
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
	const [dashboard, dashboardDispatch] = useReducer(dashboardReducer, null);
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
	const updateElement = (element, index) => {
		// console.log(selectedElementId)
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
			route(`/edit/${(JSON.parse(JSON.stringify(data.slug)))}${window.location.search}`)
			//TODO show success
		} catch (e) {
			//TODO improve
			console.log('error saving dashboard:');
			console.log(e);
		}
		setSavingDashboard(false);
	}

	return <Fragment>
		<header class="telstra-color-top-border">
			<DashboardView dashboard={dashboard} slug={slug} dashboardDispatch={dashboardDispatch}
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
					<button class="btn btn-outline-primary " onClick={e => route('/')}>Home</button>
					<button onClick={saveDashboard} class={ savingDashboard ? 'loading' : ''} class="rounded btn-primary btn-large">Save Dashboard</button>
				</div>
		</header>
	</Fragment>
}

function TransformableElement({rect, updateRect, rotation, updateRotation, children, glow, highlight}) {
	//Handle dragging elements
	const handleMove = downEvent => {
		const mousemove = moveEvent => {

			let elementNode = downEvent.target;
			if (elementNode.className === 'video-overlay') {
				elementNode = elementNode.parentElement
			}
			if (elementNode.className === 'audio-container') {
				elementNode = elementNode.parentElement
			}

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
			let elementNode = downEvent.target.parentElement;

			console.log(elementNode.firstElementChild)
			const dashboardNode = elementNode.parentElement;

			//Get max dimensions
			let width = elementNode.clientWidth + moveEvent.movementX;
			let height = elementNode.clientHeight + moveEvent.movementY;
			let maxWidth = dashboardNode.clientWidth - elementNode.offsetLeft;
			let maxHeight = dashboardNode.clientHeight - elementNode.offsetTop;

			// //get max video dimensions
			// if (elementNode.firstElementChild === 'video-overlay') {
			// 	width = elementNode.firstElementChild.clientWidth + moveEvent.movementX;
			// 	height = elementNode.firstElementChild.clientHeight + moveEvent.movementY;
			// 	maxWidth = dashboardNode.clientWidth - elementNode.firstElementChild.offsetLeft;
			// 	maxHeight = dashboardNode.clientHeight - elementNode.firstElementChild.offsetTop;
			// }

			//limit minimum resize
			width = width < 40 ? 40 : width;
			width = width < maxWidth ? width : maxWidth;
			height = height < 40 ? 40 : height;
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

	const handleRotate = downEvent => {
		downEvent.stopPropagation();

		const mousemove = moveEvent => {
			//Go up an element due to rotate dot
			const elementRect = downEvent.target.parentElement.getBoundingClientRect();

			let centerX = elementRect.left + ((elementRect.right - elementRect.left) / 2.0);
			let centerY = elementRect.top + ((elementRect.bottom - elementRect.top) / 2.0);

			const mouseX = moveEvent.clientX;
			const mouseY = moveEvent.clientY;

			const radians = Math.atan2(mouseY - centerY, mouseX - centerX);
			updateRotation(radians);
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

	const _rotation = rotation ? `rotate(${rotation}rad)` : `rotate(0rad)`;

	return <div class={`check ${glow || highlight ? 'glow' : ''}`}
		style={{left: left, top: top, width: width, height: height, transform: _rotation}}
		onMouseDown={handleMove}>
			{children}
			<div class="resize" onMouseDown={handleResize}></div>
			<div class="rotate" onMouseDown={handleRotate}></div>
	</div>
}

function DashboardElements({dashboardDispatch, selectedElementId, elements, highlightedElementId, dashboard, slug}) {
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

		const updateRotation = radian => {
			dashboardDispatch({
				type: 'updateElement',
				elementIndex: index,
				element: {
					...element,
					rotation: radian
				}
			});
		}

		let ele = null;
		if(element.type === 'check-card') { ele = <CheckCard options={element.options} slug={slug} dashboard={dashboard}/> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options} slug={slug} dashboard={dashboard}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options} slug={slug} dashboard={dashboard}/> }
		if(element.type === 'check-line') { ele = <CheckLine options={element.options} slug={slug} dashboard={dashboard}/> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }
		if(element.type === 'iframe-video') { ele = <IframeVideo options={element.options}/> }
		if(element.type === 'audio-stream') { ele = <AudioStream options={element.options}/> }

		return  <TransformableElement rect={element.rect} updateRect={updateRect}
					glow={selectedElementId === index} highlight={highlightedElementId === index}
					updateRotation={updateRotation} rotation={element.rotation}>
					{ele}
			    </TransformableElement>
	});
}

//The actual dashboard being rendered
export function DashboardView({dashboard, dashboardDispatch, selectedElementId, highlightedElementId, slug}) {
	const backgroundImage = dashboard.background ? dashboard.background : null;

	return <div class="dashboard-wrap" style={{ Height: backgroundImage ? dashboard.height : '100vh', Width: backgroundImage ? dashboard.width : '100vw'}}>
		<div class="dashboard" style={{ Height: backgroundImage ? dashboard.height : '100%', Width: backgroundImage ? dashboard.width : '100%'}}>
			{backgroundImage ? <img src={backgroundImage} class="noselect" style="height: 100%; width: 100%;" id="dashboard-dimensions"/> : <div class="noselect" style="height: 95vh; width: 70vh"></div>}
			
			<DashboardElements slug={slug} elements={dashboard.elements} dashboard={dashboard} selectedElementId={selectedElementId}
				dashboardDispatch={dashboardDispatch} highlightedElementId={highlightedElementId}/>
    	</div>
	</div>
}

//Settings view for the sidebar
function SidePanelSettings({dashboardDispatch, dashboard}) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () => showAdvanced ? setAdvanced(false) : setAdvanced(true);

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

	const muteAlerts = (e) => {
		let volumeChecked = dashboard.globalMute;
		volumeChecked = !volumeChecked;
		dashboardDispatch({
			type: 'setGlobalMute',
			globalMute: volumeChecked
		});
	}

	return <Fragment>
		<label for="title">Title</label>
		<input class="form-control" type="text" id="title" placeholder="Network Overview" value={dashboard.title}
			onInput={e => dashboardDispatch({type: 'setTitle', title: e.currentTarget.value})} />

		<TagEditor tags={dashboard.tags} updateTags={tags => updateTags(tags)} />

		<label for="background-image">Background Image {imgControls(dashboard.background)}</label>
		<input class="form-control" id="background-image" type="file" placeholder="Upload a background image"
			accept="image/*" onChange={handleBackgroundImg}/>
		<label class="status-font-size">Mute Status Alerts</label>
    	<input type="checkbox" defaultChecked={dashboard.globalMute} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/>
		<br/>
		<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>{showAdvanced ? 'Hide Options' : 'Global Alert Options'}</button>
		<AdvancedAlertOptions dashboardDispatch={dashboardDispatch} display={showAdvanced} dashboard={dashboard}/>
	</Fragment>
}

const AdvancedAlertOptions = ({dashboardDispatch, display, dashboard}) => {
	const handleOkSound = async e => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			dashboardDispatch({
				type: 'setGlobalOk',
				okSound: res.url
			});
			console.log(res.url)
		} catch (e) {
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	const handleCriticalSound = async e => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			dashboardDispatch({
				type: 'setGlobalCritical',
				criticalSound: res.url
			});
		} catch (e) {
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	const handleWarningSound = async e => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			dashboardDispatch({
				type: 'setGlobalWarning',
				warningSound: res.url
			});
		} catch (e) {
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	const handleUnknownSound = async e => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			dashboardDispatch({
				type: 'setGlobalUnknown',
				unknownSound: res.url
			});
		} catch (e) {
			//TODO improve
			console.log('failed to upload image and set background');
			console.log(e);
		}
	}

	const audioControls = src => {
		if(src) {
			return <Fragment>
				<a target="_blank" href={src}>view</a>&nbsp;
			</Fragment>
		}
		return null;
	}

	const resetOk = () => {
		dashboardDispatch({type: 'setGlobalOk', okSound: "/dashboards-data/ok.mp3"});
	}

	const resetCritical = () => {
		dashboardDispatch({type: 'setGlobalCritical', criticalSound: "/dashboards-data/critical.mp3"});
	}

	const resetWarning = () => {
		dashboardDispatch({type: 'setGlobalWarning',warningSound: "/dashboards-data/warning.mp3"});
	}

	const resetUnknown = () => {
		dashboardDispatch({type: 'setGlobalUnknown',unknownSound: "/dashboards-data/unknown.mp3"});
	}

	return <div style={{display: display ? '' : 'none'}}>
		<br/>
		<label for="soundFile">Ok Alert Sound {audioControls(dashboard.okSound)} <a onClick={resetOk}>default</a></label>
		<input type="file" id="okSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={handleOkSound}>
		</input>
		<label for="soundFile">Warning Alert Sound {audioControls(dashboard.warningSound)} <a onClick={resetWarning}>default</a></label>
		<input type="file" id="warningSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={handleWarningSound}>
		</input>
		<label for="soundFile">Critical Alert Sound {audioControls(dashboard.criticalSound)} <a onClick={resetCritical}>default</a></label>
		<input type="file" id="criticalSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={handleCriticalSound}>
		</input>
		<label for="soundFile">Unknown Alert Sound {audioControls(dashboard.unknownSound)} <a onClick={resetUnknown}>default</a></label>
		<input type="file" id="unknownSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={handleUnknownSound}>
		</input>
	</div>
}

function SidePanelElements({dashboard, dashboardDispatch, setHighlightedElementId, selectedElementId, state}) {
	const addElement = e => {
		const newId = dashboard.elements.length;
		dashboardDispatch({type: 'addElement'});
		routeParam('selectedElementId', newId);
	}

	const deleteElement = (e, index) => {
		e.preventDefault();
		dashboardDispatch({
			type: 'deleteElement',
			index: index,
		});
	};

	const duplicateElement = (e, index) => {
		e.preventDefault();
		const newId = dashboard.elements.length;
		dashboardDispatch({
			type: 'duplicateElement',
			element: dashboard.elements[index]
		});
		routeParam('selectedElementId', newId);
	};

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
		<div class="element-item" draggable={true} id={index} onDragStart={handleDragStart}>
			<div onClick={ e => routeParam('selectedElementId', index.toString()) }>
				<div class="element-title">{element.title}</div>
			</div>
				<button class="rounded btn-dark btn-sml m-0 mr-1 mt-1 medium" onClick={e => duplicateElement(e,index)}>Duplicate</button>
				<button class="rounded btn-danger btn-sml m-0 mr-1 mt-1 medium" onClick={e => deleteElement(e,index)}>Delete</button>
			<div class="drop-zone" onDrop={handleDrop} id={index}
				 				   onDragEnter={e => {e.preventDefault(); e.currentTarget.classList.add('active')}}
				 				   onDragOver={e => e.preventDefault()}
				 				   onDragExit={e => e.currentTarget.classList.remove('active')}>
			</div>
		</div>
	));

	if(elementList.length < 1) { elementList = <div class="subtle">No elements added.</div>}

	return <Fragment>
		<div class="lefty-righty spacer">
			<h3>Elements</h3>
			<button class="small btn btn-outline-primary" onClick={addElement}>New</button>
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

	//sets good default values for each visual type when they're selected
	const updateType = e => {
		const newType = e.currentTarget.value
		let defaults = {};
		switch(newType) {
			case 'check-svg': defaults = CheckSVGDefaults; break;
			case 'check-line': defaults = CheckLineDefaults; break;
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
	if (selectedElement.type === 'check-card')   { ElementOptions = <CheckCardOptions   updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'check-svg')    { ElementOptions = <CheckSVGOptions    updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'check-image')  { ElementOptions = <CheckImageOptions  updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'check-line')   { ElementOptions = <CheckLineOptions   updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'static-text')  { ElementOptions = <StaticTextOptions  updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'static-svg')   { ElementOptions = <StaticSVGOptions   updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'static-image') { ElementOptions = <StaticImageOptions updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'iframe-video') { ElementOptions = <IframeVideoOptions updateOptions={updateElementOptions} options={selectedElement.options} /> }
	if (selectedElement.type === 'audio-stream') { ElementOptions = <AudioOptions       updateOptions={updateElementOptions} options={selectedElement.options} /> }

	return <div class="form-group">
		<div class="editor settings-overlay">
		<div class="options">
			<div class="lefty-righty spacer">
				<h3 class="no-margin">{selectedElement.title}</h3>
				<svg class="feather" onClick={e => removeParam('selectedElementId')}>
					<use xlinkHref={`/res/svgs/feather-sprite.svg#x`}/>
				</svg>
			</div>
			<div class="settings">
				<label for="name">Name</label>
				<input class="form-control" id="name" type="text" placeholder="Cool Element" value={selectedElement.title}
					onInput={e => updateElement({...selectedElement, title: e.currentTarget.value})} />

				<label>Visual Type</label>
				<select class="form-control" name="item-type" value={selectedElement.type} onInput={updateType}>
					<option value="check-card">Icinga Card</option>
					<option value="check-svg">Icinga SVG</option>
					<option value="check-image">Icinga Image</option>
					<option value="check-line">Icinga Line</option>
					<option value="static-text">Static Text</option>
					<option value="static-svg">Static SVG</option>
					<option value="static-image">Static Image</option>
					<option value="iframe-video">HLS Stream</option>
					<option value="audio-stream">Audio Stream</option>
				</select>
				<hr />

				{ElementOptions}
			</div>
		</div>
	</div>
</div>
}
