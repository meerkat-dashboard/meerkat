import { h, Fragment } from "preact";
import { useEffect, useReducer, useState } from "preact/hooks";

import * as meerkat from "./meerkat";
import { CheckSVG, CheckSVGOptions } from "./elements/svg";
import {
	CheckLine,
	CheckLineOptions,
	CheckLineDefaults,
} from "./elements/line";
import { ImageOptions } from "./elements/image";
import {
	StaticText,
	StaticTextOptions,
	StaticTextDefaults,
} from "./statics/text";
import { StaticSVG, StaticSVGOptions, StaticSVGDefaults } from "./statics/svg";
import { Video, VideoOptions } from "./elements/video";
import { AudioOptions } from "./elements/audio";
import { Clock, ClockOptions } from "./elements/clock";
import { ObjectCard, ObjectCardOptions } from "./elements/i2object";

function defaultElementOptions(typ) {
	switch (typ) {
		case "check-line":
			return CheckLineDefaults;
		case "static-text":
			return StaticTextDefaults;
		case "static-svg":
			return StaticSVGDefaults;
	}
	return {};
}

const defaultElement = {
	title: "New element",
	type: "static-text",
	rect: { x: 0, y: 0, w: 30, h: 12 },
	options: {
		fontSize: 36,
		text: "Hello, world!",
		fontColor: "black",
		backgroundColor: "white",
	},
};

function dashboardReducer(state, action) {
	switch (action.type) {
		case "setDashboard":
			return action.dashboard;
		case "addElement":
			if (state.elements) {
				return {
					...state,
					elements: state.elements.concat(defaultElement),
				};
			}
			return {
				...state,
				elements: [defaultElement],
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
			const ns = { ...state };

			const element = ns.elements[action.sourcePosition];
			ns.elements.splice(action.sourcePosition, 1);
			ns.elements.splice(action.destinationPosition, 0, element);

			return ns;
		default:
			throw new Error(`Unexpected action`);
	}
}

export function Editor({ slug }) {
	const [dashboard, dashboardDispatch] = useReducer(dashboardReducer, null);
	const [highlightedElementId, setHighlightedElementId] = useState(null);
	const [selectedElement, setSelectedElement] = useState(null);

	useEffect(() => {
		meerkat.getDashboard(slug).then(async (d) => {
			dashboardDispatch({ type: "setDashboard", dashboard: d });
		});
	}, [slug]);

	if (dashboard === null) {
		return;
	}

	const updateElement = (element) => {
		setSelectedElement(element);
		dashboardDispatch({
			type: "updateElement",
			elementIndex: highlightedElementId,
			element: element,
		});
	};

	const saveAndView = async (e) => {
		try {
			await meerkat.saveDashboard(slug, dashboard);
			location.href = `/${dashboard.slug}/view`;
		} catch (e) {
			alert(`Error saving dashboard: ${e.message}`);
		}
	};

	function handleClose() {
		setSelectedElement(null);
		setHighlightedElementId(-1);
	}

	return (
		<Fragment>
			<header class="editor bg-dark">
				<h2>{dashboard.title}</h2>
				<hr />
				<SidePanelElements
					dashboard={dashboard}
					dashboardDispatch={dashboardDispatch}
					setSelectedElement={setSelectedElement}
					setHighlightedElementId={setHighlightedElementId}
				/>

				<ElementSettings
					element={selectedElement}
					updateElement={updateElement}
					closeElement={handleClose}
				/>
			</header>
			<footer class="side-bar-footer bg-dark">
				<a href="/" class="btn btn-secondary">
					Home
				</a>
				<button onClick={saveAndView} class="btn btn-success">
					Save & View
				</button>
			</footer>
			<main class="dashboard-wrap">
				<DashboardView
					dashboard={dashboard}
					updateElement={updateElement}
					highlightedElementId={highlightedElementId}
					setSelectedElement={setSelectedElement}
					setHighlightedElementId={setHighlightedElementId}
				/>
			</main>
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
	highlight,
	index,
	onClick,
}) {
	//Handle dragging elements
	const handleMove = (downEvent) => {
		const mousemove = (moveEvent) => {
			let elementNode = downEvent.target;
			const dashboardNode = document.getElementById("dashboard");

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

	// if we click an element, we want to "highlight" it, and set it as the selected element.

	function handleClick() {
		setHighlightedElementId(index);
	}

	const left = `${rect.x}%`;
	const top = `${rect.y}%`;
	const width = `${rect.w}%`;
	const height = `${rect.h}%`;

	const _rotation = rotation ? `rotate(${rotation}rad)` : `rotate(0rad)`;

	return (
		<div
			class={`check check-editing ${highlight ? "glow" : ""}`}
			style={{
				left: left,
				top: top,
				width: width,
				height: height,
				transform: _rotation,
			}}
			onMouseDown={highlight ? handleMove : null}
			onClick={onClick}
		>
			{children}
			<Grabbers
				active={highlight}
				handleResize={handleResize}
				handleRotate={handleRotate}
			/>
		</div>
	);
}

function Grabbers({ active, handleResize, handleRotate }) {
	if (!active) {
		return null;
	}
	return (
		<Fragment>
			<div class="resize" onMouseDown={handleResize}></div>
			<div class="rotate" onMouseDown={handleRotate}></div>
		</Fragment>
	);
}

function DashboardElements({
	updateElement,
	elements,
	highlightedElementId,
	setHighlightedElementId,
	setSelectedElement,
}) {
	if (!elements) {
		return null;
	}
	return elements.map((element, index) => {
		const updateRect = (rect) => {
			element.rect = rect;
			updateElement(element);
		};

		const updateRotation = (radian) => {
			element.rotation = radian;
			updateElement(element);
		};

		function handleClick() {
			setHighlightedElementId(index);
			setSelectedElement(element);
		}

		let ele;
		switch (element.type) {
			case "check-svg":
				ele = <CheckSVG />;
				break;
			case "check-line":
				ele = <CheckLine options={element.options} />;
				break;
			case "clock":
				ele = (
					<Clock
						timeZone={element.options.timeZone}
						fontSize={element.options.fontSize}
					/>
				);
				break;
			case "static-text":
				ele = <StaticText options={element.options} />;
				break;
			case "static-svg":
				ele = <StaticSVG options={element.options} />;
				break;
			case "image":
				ele = <img src={element.options.image} />;
				break;
			case "video":
				ele = <Video options={element.options} />;
				break;
			case "audio":
				ele = <audio controls src={element.options.audioSource}></audio>;
				break;
			case "check-card":
				ele = (
					<ObjectCard
						objectType={element.options.objectType}
						objectName={element.options.objectName}
						objectAttr={element.options.objectAttr}
						fontSize={element.options.fontSize}
					/>
				);
				break;
		}

		return (
			<TransformableElement
				rect={element.rect}
				updateRect={updateRect}
				checkType={element.type}
				highlight={highlightedElementId === index}
				updateRotation={updateRotation}
				rotation={element.rotation}
				index={index}
				onClick={handleClick}
			>
				{ele}
			</TransformableElement>
		);
	});
}

function DashboardView({
	dashboard,
	updateElement,
	highlightedElementId,
	setSelectedElement,
	setHighlightedElementId,
}) {
	const backgroundImage = dashboard.background ? dashboard.background : null;

	return (
		<div
			style={{
				Height: backgroundImage ? dashboard.height : "100vh",
				Width: backgroundImage ? dashboard.width : "100vw",
			}}
		>
			<div
				id="dashboard"
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
					elements={dashboard.elements}
					updateElement={updateElement}
					highlightedElementId={highlightedElementId}
					setSelectedElement={setSelectedElement}
					setHighlightedElementId={setHighlightedElementId}
				/>
			</div>
		</div>
	);
}

function SidePanelElements({
	dashboard,
	dashboardDispatch,
	setSelectedElement,
	setHighlightedElementId,
}) {
	const addElement = () => {
		dashboardDispatch({ type: "addElement" });
	};
	const deleteElement = (id) => {
		dashboardDispatch({
			type: "deleteElement",
			index: id,
		});
	};
	const duplicateElement = (id) => {
		dashboardDispatch({
			type: "duplicateElement",
			element: dashboard.elements[id],
		});
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

	const handleSelect = (id, element) => {
		setSelectedElement(element);
		setHighlightedElementId(id);
	};

	let elementList;
	if (dashboard.elements) {
		elementList = dashboard.elements.map((element, index) => (
			<div
				class="element-item"
				draggable={true}
				id={index}
				onDragStart={handleDragStart}
			>
				<ElementEntry
					title={element.title}
					onSelect={() => handleSelect(index, element)}
					onDuplicate={() => duplicateElement(index)}
					onDelete={() => deleteElement(index)}
				/>
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
	}

	return (
		<Fragment>
			<div class="d-flex justify-content-between align-items-center">
				<h3>Elements</h3>
				<button class="btn btn-primary btn-sm" onClick={addElement}>
					New
				</button>
			</div>
			{elementList}
		</Fragment>
	);
}

function ElementEntry({ title, onSelect, onDuplicate, onDelete }) {
	return (
		<Fragment>
			<div onClick={onSelect}>{title}</div>
			<button class="btn btn-primary btn-sm" onClick={onDuplicate}>
				Duplicate
			</button>
			<button class="btn btn-danger btn-sm ms-1" onClick={onDelete}>
				Delete
			</button>
		</Fragment>
	);
}

function ElementSettings({ element, updateElement, closeElement }) {
	if (element === null) {
		return null;
	}

	const updateElementOptions = (options) => {
		const newOptions = Object.assign(element.options, options);
		updateElement({ ...element, options: newOptions });
	};

	//sets good default values for each visual type when they're selected
	const updateType = (e) => {
		const newType = e.currentTarget.value;
		updateElement({
			...element,
			type: newType,
			options: defaultElementOptions(newType),
		});
	};

	let ElementOptions = null;
	if (element.type === "check-svg") {
		ElementOptions = (
			<CheckSVGOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "clock") {
		ElementOptions = (
			<ClockOptions
				onChange={updateElementOptions}
				timeZone={element.options.timeZone}
				fontSize={element.options.fontSize}
			/>
		);
	}
	if (element.type === "check-line") {
		ElementOptions = (
			<CheckLineOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "static-text") {
		ElementOptions = (
			<StaticTextOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "static-svg") {
		ElementOptions = (
			<StaticSVGOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "image") {
		ElementOptions = (
			<ImageOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "video") {
		ElementOptions = (
			<VideoOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	}
	if (element.type === "audio") {
		ElementOptions = (
			<AudioOptions
				updateOptions={updateElementOptions}
				options={element.options}
			/>
		);
	} else if (element.type == "check-card") {
		ElementOptions = (
			<ObjectCardOptions
				options={element.options}
				updateOptions={updateElementOptions}
			/>
		);
	}

	return (
		<div class="editor settings-overlay bg-dark">
			<div class="d-flex justify-content-between align-items-center">
				<h3>{element.title}</h3>
				<button class="btn btn-secondary" onClick={closeElement}>
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
					value={element.title}
					onInput={(e) =>
						updateElement({
							...element,
							title: e.currentTarget.value,
						})
					}
				/>

				<label>Element type</label>
				<select
					class="form-select"
					name="element-type"
					value={element.type}
					onInput={updateType}
				>
					<option value="check-card">Icinga Card</option>
					<option value="check-svg">Icinga SVG</option>
					<option value="check-line">Icinga Line</option>
					<option value="static-text">Static Text</option>
					<option value="static-svg">Static SVG</option>
					<option value="image">Image</option>
					<option value="video">Video</option>
					<option value="audio">Audio</option>
					<option value="clock">Clock</option>
				</select>
				<hr />

				{ElementOptions}
			</form>
		</div>
	);
}
