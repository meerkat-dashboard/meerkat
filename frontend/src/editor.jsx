import { h, Fragment } from "preact";
import { route } from "preact-router";
import { useEffect, useReducer, useState } from "preact/hooks";

import * as meerkat from "./meerkat";
import { routeParam, removeParam, TagEditor } from "./util";
import { CheckCard, CheckCardOptions } from "./elements/card";
import { CheckSVG, CheckSVGOptions, CheckSVGDefaults } from "./elements/svg";
import { CheckImage, CheckImageOptions } from "./elements/image";
import {
	CheckLine,
	CheckLineOptions,
	CheckLineDefaults,
} from "./elements/line";
import {
	DynamicText,
	DynamicTextOptions,
	DynamicTextDefaults,
} from "./elements/text";
import {
	StaticText,
	StaticTextOptions,
	StaticTextDefaults,
} from "./statics/text";
import {
	StaticTicker,
	StaticTickerOptions,
	StaticTickerDefaults,
} from "./statics/ticker";
import { StaticSVG, StaticSVGOptions, StaticSVGDefaults } from "./statics/svg";
import { StaticImage, StaticImageOptions } from "./statics/image";
import { IframeVideo, IframeVideoOptions } from "./elements/video";
import { AudioStream, AudioOptions } from "./elements/audio";
import { Clock, ClockOptions } from "./elements/clock";

function defaultElementOptions(typ) {
	switch (typ) {
	case "check-svg":
		return CheckSVGDefaults;
	case "check-line":
		return CheckLineDefaults;
	case "dynamic-text":
		return DynamicTextDefaults;
	case "static-text":
		return StaticTextDefaults;
	case "static-ticker":
		return StaticTickerDefaults;
	case "static-svg":
		return StaticSVGDefaults;
	}
	return {};
}

function dashboardReducer(state, action) {
	switch (action.type) {
		case "setDashboard":
			return action.dashboard;
		case "setTitle":
			return { ...state, title: action.title };
		case "setTags":
			return { ...state, tags: action.tags };
		case "setBackground":
			return { ...state, background: action.background };
		case "addElement":
			const newElement = {
				type: "check-card",
				rect: { x: 0, y: 0, w: 15, h: 12 },
				options: {
					objectType: null,
					filter: null,
					selection: "",
					fontSize: 60,
				},
			};
			return {
				...state,
				elements: state.elements.concat(newElement),
			};

		case "deleteElement":
			const nstate = { ...state };
			nstate.elements.splice(action.index, 1);
			return nstate;
		case "duplicateElement":
			return {
				...state,
				elements: state.elements.concat(
					JSON.parse(JSON.stringify(action.element))
				),
			};
		case "updateElement":
			console.log(
				`Updating element: ${JSON.stringify([
					action.elementIndex,
					action.element,
				])}`
			);
			const newState = { ...state };
			newState.elements[action.elementIndex] = JSON.parse(
				JSON.stringify(action.element)
			);
			return newState;
		case "reorderElements":
			console.log("Reordering elements");
			const ns = { ...state };

			const element = ns.elements[action.sourcePosition];
			ns.elements.splice(action.sourcePosition, 1);
			ns.elements.splice(action.destinationPosition, 0, element);

			return ns;
		default:
			throw new Error(`Unexpected action`);
	}
}

export function Editor({ slug, selectedElementId }) {
	const [dashboard, dashboardDispatch] = useReducer(dashboardReducer, null);
	const [savingDashboard, setSavingDashboard] = useState(false);
	const [highlightedElementId, setHighlightedElementId] = useState(null);

	useEffect(() => {
		meerkat.getDashboard(slug).then(async (d) => {
			dashboardDispatch({ type: "setDashboard", dashboard: d });
		});
	}, [slug]);

	if (dashboard === null) {
		return <div class="loading center subtle">Loading dashboard</div>;
	}

	const selectedElement = selectedElementId
		? dashboard.elements[selectedElementId]
		: null;
	if (typeof selectedElement === "undefined") {
		removeParam("selectedElementId");
		return;
	}
	const updateElement = (element, index) => {
		dashboardDispatch({
			type: "updateElement",
			elementIndex: selectedElementId,
			element: element,
		});
	};

	const saveDashboard = async (e) => {
		setSavingDashboard(true);
		try {
			const data = await meerkat.saveDashboard(slug, dashboard);
			route(
				`/edit/${JSON.parse(JSON.stringify(data.slug))}${
					window.location.search
				}`
			);
		} catch (e) {
			console.log("error saving dashboard:", e);
		}
		setSavingDashboard(false);
	};

	return (
		<Fragment>
			<header>
				<div class="editor">
					<h2>{dashboard.title}</h2>
					<SidePanelSettings
						dashboard={dashboard}
						dashboardDispatch={dashboardDispatch}
					/>
					<hr />
					<SidePanelElements
						dashboard={dashboard}
						dashboardDispatch={dashboardDispatch}
						slug={slug}
						setHighlightedElementId={setHighlightedElementId}
					/>

					<ElementSettings
						selectedElement={selectedElement}
						updateElement={updateElement}
					/>
				</div>
				<div class="side-bar-footer lefty-righty">
					<button class="btn btn-secondary " onClick={(e) => route("/")}>
						Home
					</button>
					<button onClick={saveDashboard} class="btn btn-success">
						Save Dashboard
					</button>
				</div>
			</header>
			<DashboardView
				dashboard={dashboard}
				slug={slug}
				dashboardDispatch={dashboardDispatch}
				selectedElementId={selectedElementId ? Number(selectedElementId) : null}
				highlightedElementId={highlightedElementId}
			/>
		</Fragment>
	);
}

function TransformableElement({
	rect,
	updateRect,
	checkType,
	rotation,
	updateRotation,
	children,
	glow,
	highlight,
	index,
}) {
	// Open editor on left sidepanel
	const handleEdit = (event) => routeParam("selectedElementId", index);

	//Handle dragging elements
	const handleMove = (downEvent) => {
		const mousemove = (moveEvent) => {
			let elementNode = downEvent.target;
			if (elementNode.className === "video-overlay") {
				elementNode = elementNode.parentElement;
			}
			if (elementNode.className === "audio-container") {
				elementNode = elementNode.parentElement;
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
			const relativeLeft = (left / dashboardNode.clientWidth) * 100;
			const relativeTop = (top / dashboardNode.clientHeight) * 100;

			//set position
			updateRect({ x: relativeLeft, y: relativeTop, w: rect.w, h: rect.h });
		};

		//Remove listeners on mouse button up
		const mouseup = () => {
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
		};

		//Add movement and mouseup events
		window.addEventListener("mouseup", mouseup);
		window.addEventListener("mousemove", mousemove);
	};

	const handleResize = (downEvent) => {
		downEvent.stopPropagation();

		const mousemove = (moveEvent) => {
			//Go up an element due to resize dot
			let elementNode = downEvent.target.parentElement;

			const dashboardNode = elementNode.parentElement;

			//Get max dimensions
			let width = elementNode.clientWidth + moveEvent.movementX;
			let height = elementNode.clientHeight + moveEvent.movementY;
			let maxWidth = dashboardNode.clientWidth - elementNode.offsetLeft;
			let maxHeight = dashboardNode.clientHeight - elementNode.offsetTop;

			//limit minimum resize
			width = width < 40 ? 40 : width;
			width = width < maxWidth ? width : maxWidth;
			height = height < 40 ? 40 : height;
			height = height < maxHeight ? height : maxHeight;

			//convert dimensions to relative (px -> percentage based)
			const relativeWidth = (width / dashboardNode.clientWidth) * 100;
			const relativeHeight = (height / dashboardNode.clientHeight) * 100;

			//set position
			updateRect({ x: rect.x, y: rect.y, w: relativeWidth, h: relativeHeight });
		};

		//Remove listeners on mouse button up
		const mouseup = () => {
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
		};

		//Add movement and mouseup events
		window.addEventListener("mouseup", mouseup);
		window.addEventListener("mousemove", mousemove);
	};

	const handleRotate = (downEvent) => {
		downEvent.stopPropagation();

		const mousemove = (moveEvent) => {
			//Go up an element due to rotate dot
			const elementRect =
				downEvent.target.parentElement.getBoundingClientRect();

			let centerX =
				elementRect.left + (elementRect.right - elementRect.left) / 2.0;
			let centerY =
				elementRect.top + (elementRect.bottom - elementRect.top) / 2.0;

			const mouseX = moveEvent.clientX;
			const mouseY = moveEvent.clientY;

			const radians = Math.atan2(mouseY - centerY, mouseX - centerX);
			updateRotation(radians);
		};

		//Remove listeners on mouse button up
		const mouseup = () => {
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
		};

		//Add movement and mouseup events
		window.addEventListener("mouseup", mouseup);
		window.addEventListener("mousemove", mousemove);
	};

	const left = `${rect.x}%`;
	const top = `${rect.y}%`;
	const width = `${rect.w}%`;
	const height = `${rect.h}%`;

	const _rotation = rotation ? `rotate(${rotation}rad)` : `rotate(0rad)`;

	return checkType === "static-ticker" ? (
		<div
			class={`ticker ticker-editing ${glow || highlight ? "glow" : ""}`}
			style={{ left: left, top: top, width: "100%", height: height }}
			onMouseDown={handleMove}
		>
			{children}
			<button
				type="button"
				class="edit btn btn-primary btn-sm"
				onClick={handleEdit}
			>
				Edit
			</button>
			<div class="resize" onMouseDown={handleResize}></div>
		</div>
	) : (
		<div
			class={`check check-editing ${glow || highlight ? "glow" : ""}`}
			style={{
				left: left,
				top: top,
				width: width,
				height: height,
				transform: _rotation,
			}}
			onMouseDown={handleMove}
		>
			{children}
			<button
				type="button"
				class="edit btn btn-primary btn-sm"
				onClick={handleEdit}
			>
				Edit
			</button>
			<div class="resize" onMouseDown={handleResize}></div>
			<div class="rotate" onMouseDown={handleRotate}></div>
		</div>
	);
}

function DashboardElements({
	dashboardDispatch,
	selectedElementId,
	elements,
	highlightedElementId,
	dashboard,
	slug,
}) {
	return elements.map((element, index) => {
		const updateRect = (rect) => {
			dashboardDispatch({
				type: "updateElement",
				elementIndex: index,
				element: {
					...element,
					rect: rect,
				},
			});
		};

		const updateRotation = (radian) => {
			dashboardDispatch({
				type: "updateElement",
				elementIndex: index,
				element: {
					...element,
					rotation: radian,
				},
			});
		};

		let ele;
		switch(element.type) {
		case "check-card":
			ele = (
				<CheckCard
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
			break;
		case "check-svg":
			ele = (
				<CheckSVG options={element.options} slug={slug} dashboard={dashboard} />
			);
			break;
		case "check-image":
			ele = (
				<CheckImage
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
			break;
		case "check-line":
			ele = (
				<CheckLine
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
			break;
		case "clock":
			ele = <Clock timeZone={element.options.timeZone} fontSize={element.options.fontSize} />;
			break;
		case "static-text":
			ele = <StaticText options={element.options} />;
			break;
		case "dynamic-text":
			ele = <DynamicText options={element.options} />;
			break;
		case "static-ticker":
			ele = <StaticTicker options={element.options} />;
			break;
		case "static-svg":
			ele = <StaticSVG options={element.options} />;
			break;
		case "static-image":
			ele = <StaticImage options={element.options} />;
			break;
		case "iframe-video":
			ele = <IframeVideo options={element.options} />;
			break;
		case "audio-stream":
			ele = <AudioStream options={element.options} />;
		}

		return (
			<TransformableElement
				rect={element.rect}
				updateRect={updateRect}
				checkType={element.type}
				glow={selectedElementId === index}
				highlight={highlightedElementId === index}
				updateRotation={updateRotation}
				rotation={element.rotation}
				index={index}
			>
				{ele}
			</TransformableElement>
		);
	});
}

export function DashboardView({
	dashboard,
	dashboardDispatch,
	selectedElementId,
	highlightedElementId,
	slug,
}) {
	const backgroundImage = dashboard.background ? dashboard.background : null;

	return (
		<div
			class="dashboard-wrap"
			style={{
				Height: backgroundImage ? dashboard.height : "100vh",
				Width: backgroundImage ? dashboard.width : "100vw",
			}}
		>
			<div
				class="dashboard"
				style={{
					Height: backgroundImage ? dashboard.height : "100%",
					Width: backgroundImage ? dashboard.width : "100%",
				}}
			>
				{backgroundImage ? (
					<img
						src={backgroundImage}
						class="noselect"
						style="height: 100%; width: 100%;"
						id="dashboard-dimensions"
					/>
				) : (
					<div class="noselect" style="height: 95vh; width: 70vh"></div>
				)}

				<DashboardElements
					slug={slug}
					elements={dashboard.elements}
					dashboard={dashboard}
					selectedElementId={selectedElementId}
					dashboardDispatch={dashboardDispatch}
					highlightedElementId={highlightedElementId}
				/>
			</div>
		</div>
	);
}

function SidePanelSettings({ dashboardDispatch, dashboard }) {
	const handleBackgroundImg = async (e) => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);

			dashboardDispatch({
				type: "setBackground",
				background: res.url,
			});
		} catch (e) {
			console.log("failed to upload image and set background");
			console.log(e);
		}
	};

	const updateTags = (tags) => {
		dashboardDispatch({
			type: "setTags",
			tags: tags.map((v) => v.toLowerCase().trim()),
		});
	};

	const clearBackground = (e) => {
		e.preventDefault();
		dashboardDispatch({
			type: "setBackground",
			background: null,
		});
	};

	const imgControls = (src) => {
		if (src) {
			return (
				<Fragment>
					<a onClick={clearBackground}>clear</a>
					&nbsp;
					<a target="_blank" href={src}>
						view
					</a>
				</Fragment>
			);
		}
		return null;
	};

	return (
		<Fragment>
			<label class="form-label" for="title">
				Title
			</label>
			<input
				class="form-control"
				type="text"
				id="title"
				placeholder="Network Overview"
				value={dashboard.title}
				onInput={(e) =>
					dashboardDispatch({ type: "setTitle", title: e.currentTarget.value })
				}
			/>

			<TagEditor
				tags={dashboard.tags}
				updateTags={(tags) => updateTags(tags)}
			/>

			<fieldset class="form-group">
				<label class="form-label" for="background-image">
					Background image {imgControls(dashboard.background)}
				</label>
				<input
					class="form-control"
					id="background-image"
					type="file"
					placeholder="Upload a background image"
					accept="image/*"
					onChange={handleBackgroundImg}
				/>
			</fieldset>
		</Fragment>
	);
}

function SidePanelElements({
	dashboard,
	dashboardDispatch,
	setHighlightedElementId,
	selectedElementId,
	state,
	slug,
}) {
	const addElement = (e) => {
		const newId = dashboard.elements.length;
		dashboardDispatch({ type: "addElement" });
		routeParam("selectedElementId", newId);
	};

	const deleteElement = (e, index) => {
		e.preventDefault();
		dashboardDispatch({
			type: "deleteElement",
			index: index,
		});
	};

	const duplicateElement = (e, index) => {
		e.preventDefault();
		const newId = dashboard.elements.length;
		dashboardDispatch({
			type: "duplicateElement",
			element: dashboard.elements[index],
		});
		routeParam("selectedElementId", newId);
	};

	const handleDragStart = (e) => {
		e.dataTransfer.setData("source-id", e.target.id);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.currentTarget.classList.remove("active");
		const sourceId = e.dataTransfer.getData("source-id");
		const destId = e.target.id;
		dashboardDispatch({
			type: "reorderElements",
			sourcePosition: sourceId,
			destinationPosition: destId,
		});
	};

	let elementList = dashboard.elements.map((element, index) => (
		<div
			class="element-item"
			draggable={true}
			id={index}
			onDragStart={handleDragStart}
		>
			<div onClick={(e) => routeParam("selectedElementId", index.toString())}>
				{element.title}
			</div>
			<button
				class="btn btn-primary btn-sm"
				onClick={(e) => duplicateElement(e, index)}
			>
				Duplicate
			</button>
			<button
				style="margin-left: 5px"
				class="btn btn-danger btn-sm"
				onClick={(e) => deleteElement(e, index)}
			>
				Delete
			</button>
			<div
				class="drop-zone"
				onDrop={handleDrop}
				id={index}
				onDragEnter={(e) => {
					e.preventDefault();
					e.currentTarget.classList.add("active");
				}}
				onDragOver={(e) => e.preventDefault()}
				onDragExit={(e) => e.currentTarget.classList.remove("active")}
			></div>
		</div>
	));

	if (elementList.length < 1) {
		elementList = <div class="subtle">No elements added.</div>;
	}

	return (
		<Fragment>
			<div class="lefty-righty spacer">
				<h3>Elements</h3>
				<span>
					<button class="btn btn-primary btn-sm" onClick={addElement}>
						New
					</button>
				</span>
			</div>
			<div class="element-list">{elementList}</div>
		</Fragment>
	);
}

export function ElementSettings({ selectedElement, updateElement }) {
	if (selectedElement === null) {
		return null;
	}

	const updateElementOptions = (options) => {
		const newOptions = Object.assign(selectedElement.options, options);
		updateElement({ ...selectedElement, options: newOptions });
	};

	//sets good default values for each visual type when they're selected
	const updateType = (e) => {
		const newType = e.currentTarget.value;

		if (newType == "static-ticker") {
			const rect = {
				x: 0,
				y: 82.84371327849588,
				w: 100,
				h: 16,
			}
			updateElement({
				...selectedElement,
				type: newType,
				rect: rect,
				options: defaultElementOptions(newType),
			});
			return;
		}

		updateElement({
			...selectedElement,
			type: newType,
			options: defaultElementOptions(newType),
		});
	};

	let ElementOptions = null;
	if (selectedElement.type === "check-card") {
		ElementOptions = (
			<CheckCardOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "check-svg") {
		ElementOptions = (
			<CheckSVGOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "clock") {
		ElementOptions = (
			<ClockOptions
				onChange={updateElementOptions}
				timeZone={selectedElement.options.timeZone}
				fontSize={selectedElement.options.fontSize}
			/>
		);
	}
	if (selectedElement.type === "check-image") {
		ElementOptions = (
			<CheckImageOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "check-line") {
		ElementOptions = (
			<CheckLineOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "static-text") {
		ElementOptions = (
			<StaticTextOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "dynamic-text") {
		ElementOptions = (
			<DynamicTextOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "static-svg") {
		ElementOptions = (
			<StaticSVGOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "static-image") {
		ElementOptions = (
			<StaticImageOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "iframe-video") {
		ElementOptions = (
			<IframeVideoOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "audio-stream") {
		ElementOptions = (
			<AudioOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}
	if (selectedElement.type === "static-ticker") {
		ElementOptions = (
			<StaticTickerOptions
				updateOptions={updateElementOptions}
				options={selectedElement.options}
			/>
		);
	}

	return (
		<div class="form-group">
			<div class="editor settings-overlay">
				<div class="options">
					<div class="lefty-righty">
						<h3>{selectedElement.title}</h3>
						<button
							class="btn btn-secondary"
							onClick={(e) => removeParam("selectedElementId")}
						>
							Close
						</button>
					</div>
					<form>
						<label for="name">Name</label>
						<input
							class="form-control"
							id="name"
							type="text"
							placeholder="A new element"
							value={selectedElement.title}
							onInput={(e) =>
								updateElement({
									...selectedElement,
									title: e.currentTarget.value,
								})
							}
						/>

						<label>Element type</label>
						<select
							class="form-select"
							name="element-type"
							value={selectedElement.type}
							onInput={updateType}
						>
							<option value="check-card">Icinga Card</option>
							<option value="check-svg">Icinga SVG</option>
							<option value="check-image">Icinga Image</option>
							<option value="check-line">Icinga Line</option>
							<option value="dynamic-text">Dynamic Text</option>
							<option value="static-text">Static Text</option>
							<option value="static-svg">Static SVG</option>
							<option value="static-image">Static Image</option>
							<option value="static-ticker">Static Ticker</option>
							<option value="iframe-video">HLS Stream</option>
							<option value="audio-stream">Audio Stream</option>
							<option value="clock">Clock</option>
						</select>
						<hr />

						{ElementOptions}
					</form>
				</div>
			</div>
		</div>
	);
}
