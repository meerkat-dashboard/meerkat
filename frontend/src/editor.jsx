import { h, Fragment } from "preact";
import { route } from "preact-router";
import { useEffect, useReducer, useState } from "preact/hooks";
import "preact/debug";

import * as meerkat from "./meerkat";
import { routeParam, removeParam, TagEditor } from "./util";
import { CheckCard, CheckCardOptions } from "./elements/card";
import { CheckDigitalClock, CheckDigitalClockOptions } from "./elements/digitalClock";
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

//Manage dashboard state
const dashboardReducer = (state, action) => {
	switch (action.type) {
		case "setDashboard":
			return action.dashboard;
		case "setTitle":
			console.log("Setting title to " + action.title);
			return { ...state, title: action.title };
		case "setTags":
			console.log(`Setting tags to ${action.tags}`);
			return { ...state, tags: action.tags };
		case "setGlobalOk":
			return { ...state, okSound: action.okSound };
		case "setGlobalCritical":
			return { ...state, criticalSound: action.criticalSound };
		case "setGlobalWarning":
			return { ...state, warningSound: action.warningSound };
		case "setGlobalUnknown":
			return { ...state, unknownSound: action.unknownSound };
		case "setGlobalUp":
			return { ...state, upSound: action.upSound };
		case "setGlobalDown":
			return { ...state, downSound: action.downSound };
		case "setBackground":
			console.log("Setting background to " + action.background);
			return { ...state, background: action.background };
		case "setGlobalMute":
			return { ...state, globalMute: action.globalMute };
		case "setGlobalTabLink":
			if (state.hasOwnProperty("tabLink")) {
				return { ...state, tabLink: action.tabLink };
			} else {
				Object.assign(state, { tabLink: action.tabLink });
				return state;
			}
		case "addElement":
			console.log("Adding new element");
			const newElement = {
				type: "check-card",
				title: "New Element",
				rect: { x: 0, y: 0, w: 15, h: 12 },
				options: {
					objectType: null,
					filter: null,
					selection: "",
					nameFontSize: 40,
					statusFontSize: 60,
					muteAlerts: false,
				},
			};
			return {
				...state,
				elements: state.elements.concat(newElement),
			};

		case "deleteElement":
			console.log("Deleting element");
			const nstate = { ...state };
			nstate.elements.splice(action.index, 1);
			return nstate;
		case "duplicateElement":
			console.log("Duplicating element");
			return {
				...state,
				elements: state.elements.concat(
					JSON.parse(JSON.stringify(action.element))
				),
			};
		case "getDimensions":
			console.log("Getting Dimensions");
			return { ...state, height: action.height, width: action.width };
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
};

//Edit page
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
			console.log("error saving dashboard:");
			console.log(e);
		}
		setSavingDashboard(false);
	};

	return (
		<Fragment>
			<header class="telstra-color-top-border">
				<DashboardView
					dashboard={dashboard}
					slug={slug}
					dashboardDispatch={dashboardDispatch}
					selectedElementId={
						selectedElementId ? Number(selectedElementId) : null
					}
					highlightedElementId={highlightedElementId}
				/>

				<div class="editor">
					<div class="options">
						<h3>{dashboard.title}</h3>
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
				</div>
				<div class="side-bar-footer lefty-righty">
					<button class="btn btn-outline-primary " onClick={(e) => route("/")}>
						Home
					</button>
					<button
						onClick={saveDashboard}
						class={savingDashboard ? "loading" : ""}
						class="rounded btn-primary btn-large"
					>
						Save Dashboard
					</button>
				</div>
			</header>
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

		let ele = null;
		if (element.type === "check-card") {
			ele = (
				<CheckCard
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
		}
		if (element.type === "digital-clock") {
			ele = (
				<CheckDigitalClock
					options={element.options}
					slug={slug}
				/>
			);
		}
		if (element.type === "check-svg") {
			ele = (
				<CheckSVG options={element.options} slug={slug} dashboard={dashboard} />
			);
		}
		if (element.type === "check-image") {
			ele = (
				<CheckImage
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
		}
		if (element.type === "check-line") {
			ele = (
				<CheckLine
					options={element.options}
					slug={slug}
					dashboard={dashboard}
				/>
			);
		}
		if (element.type === "static-text") {
			ele = <StaticText options={element.options} vars={dashboard.variables} />;
		}
		if (element.type === "dynamic-text") {
			ele = <DynamicText options={element.options} />;
		}
		if (element.type === "static-ticker") {
			ele = <StaticTicker options={element.options} />;
		}
		if (element.type === "static-svg") {
			ele = <StaticSVG options={element.options} />;
		}
		if (element.type === "static-image") {
			ele = <StaticImage options={element.options} />;
		}
		if (element.type === "iframe-video") {
			ele = <IframeVideo options={element.options} />;
		}
		if (element.type === "audio-stream") {
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
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () =>
		showAdvanced ? setAdvanced(false) : setAdvanced(true);

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

	const muteAlerts = (e) => {
		dashboardDispatch({
			type: "setGlobalMute",
			globalMute: e.target.checked,
		});
	};

	return (
		<Fragment>
			<label for="title">Title</label>
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

			<label for="background-image">
				Background Image {imgControls(dashboard.background)}
			</label>
			<input
				class="form-control"
				id="background-image"
				type="file"
				placeholder="Upload a background image"
				accept="image/*"
				onChange={handleBackgroundImg}
			/>
			<label class="status-font-size">Mute Status Alerts</label>
			<input
				type="checkbox"
				defaultChecked={dashboard.globalMute}
				onChange={(e) => muteAlerts(e)}
				class="form-control mute-sounds"
			/>
			<br />
			<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>
				{showAdvanced ? "Hide Options" : "Global Options"}
			</button>
			<AdvancedAlertOptions
				dashboardDispatch={dashboardDispatch}
				display={showAdvanced}
				dashboard={dashboard}
			/>
		</Fragment>
	);
}

const AdvancedAlertOptions = ({ dashboardDispatch, display, dashboard }) => {
	const handleAlertSound = async (e, action, sound) => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			dashboardDispatch({
				type: action,
				[sound]: res.url,
			});
		} catch (e) {
			console.log("failed to upload sound");
			console.log(e);
		}
	};

	const audioControls = (src) => {
		if (src) {
			return (
				<Fragment>
					<a target="_blank" style="color: white" href={src}>
						view
					</a>
					&nbsp;
				</Fragment>
			);
		}
		return null;
	};

	return (
		<div style={{ display: display ? "" : "none" }}>
			<br />
			<label class="new-tab">Open links in new tab</label>
			<input
				type="checkbox"
				defaultChecked={dashboard.tabLink}
				onChange={(e) =>
					dashboardDispatch({
						type: "setGlobalTabLink",
						tabLink: e.target.checked,
					})
				}
				class="form-control new-tab"
			/>
			<br />
			<label for="soundFile">
				Ok Alert Sound {audioControls(dashboard.okSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobalOk",
							okSound: "/dashboards-data/ok.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="okSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAlertSound(e, "setGlobalOk", "okSound")}
			></input>
			<label for="soundFile">
				Warning Alert Sound {audioControls(dashboard.warningSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobalUnknown",
							unknownSound: "/dashboards-data/unknown.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="warningSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAlertSound(e, "setGlobalWarning", "warningSound")}
			></input>
			<label for="soundFile">
				Critical Alert Sound {audioControls(dashboard.criticalSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobalCritical",
							criticalSound: "/dashboards-data/critical.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="criticalSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) =>
					handleAlertSound(e, "setGlobalCritical", "criticalSound")
				}
			></input>
			<label for="soundFile">
				Unknown Alert Sound {audioControls(dashboard.unknownSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobalUnknown",
							unknownSound: "/dashboards-data/unknown.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="unknownSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAlertSound(e, "setGlobalUnknown", "unknownSound")}
			></input>
			<label for="soundFile">
				Up Alert Sound {audioControls(dashboard.upSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobalup",
							upSound: "/dashboards-data/up.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="upSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAlertSound(e, "setGlobalUp", "upSound")}
			></input>
			<label for="soundFile">
				Down Alert Sound {audioControls(dashboard.downSound)}
				<a
					onClick={(e) =>
						dashboardDispatch({
							type: "setGlobaldown",
							downSound: "/dashboards-data/down.mp3",
						})
					}
				>
					default
				</a>
			</label>
			<input
				type="file"
				id="downSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAlertSound(e, "setGlobalDown", "downSound")}
			></input>
		</div>
	);
};

function VariablesModal({ hide, dashboard, slug }) {
	let [inputs, setInputs] = useState([]);

	useEffect(() => {
		let exist = [];
		if (dashboard.hasOwnProperty("variables")) {
			let i = 0;
			for (const [key, value] of Object.entries(dashboard.variables)) {
				exist.push({ ["id"]: i++, ["key"]: key, ["ori"]: key, ["val"]: value });
			}
		}

		setInputs(exist);
	}, []);

	const changeVariables = async (e) => {
		if (dashboard.hasOwnProperty("variables")) {
			delete dashboard["variables"];
		}

		let vars = {};

		for (const [key, property] of Object.entries(inputs)) {
			vars[property.key] = property.val;
		}

		let dash = { ...dashboard, variables: vars };

		let matched = [];

		inputs.forEach((changed) => {
			if (changed.key !== changed.ori) {
				matched.push(changed);
			}
		});

		dash.elements.forEach((ele) => {
			matched.forEach((key) => {
				let reg = new RegExp("~(" + key.ori + ")~", "g");

				if (
					ele.options.hasOwnProperty("filter") &&
					ele.options.filter !== null
				) {
					if (ele.options.filter.includes(`~${key.ori}~`)) {
						ele.options.filter = ele.options.filter.replaceAll(
							reg,
							`~${key.key}~`
						);
					}
				}
				if (
					ele.options.hasOwnProperty("linkURL") &&
					ele.options.linkURL !== null
				) {
					if (ele.options.linkURL.includes(`~${key.ori}~`)) {
						ele.options.linkURL = ele.options.linkURL.replaceAll(
							reg,
							`~${key.key}~`
						);
					}
				}
				if (ele.options.hasOwnProperty("text") && ele.options.text !== null) {
					if (ele.options.text.includes(`~${key.ori}~`)) {
						ele.options.text = ele.options.text.replaceAll(reg, `~${key.key}~`);
					}
				}
			});
		});

		try {
			await meerkat.saveDashboard(slug, dash);
		} catch (e) {
			console.log("Failed to change variables");
			console.log(e);
		}
	};

	const addInputs = (e) => {
		e.preventDefault();

		if (inputs.length > 50) {
			alert("Max allowed variables reached");
			return;
		}

		const newObj = [...inputs, { id: inputs.length + 1, key: "", val: "" }];
		setInputs(newObj);
	};

	const removeInputs = (e, id) => {
		e.preventDefault();
		const newInputs = inputs.filter((entry) => entry.id !== id);
		setInputs(newInputs);
	};

	const updateKey = (id, ent) => {
		const key = ent.target.value;
		const updatedInputs = inputs.map((ent, index) =>
			index === id ? { ...ent, key: key } : ent
		);
		setInputs(updatedInputs);
	};

	const updateValue = (id, ent) => {
		const val = ent.target.value;
		const updatedInputs = inputs.map((ent, index) =>
			index === id ? { ...ent, val: val } : ent
		);
		setInputs(updatedInputs);
	};

	return (
		<div class="modal-wrap" onMouseDown={hide}>
			<div
				class="modal-fixed template-modal"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div class="row">
					<div class="col-md-4">
						<h3>Variables</h3>
					</div>
					<div class="col-sm-4"></div>
				</div>
				<form>
					<div class="form-row template-inputs">
						{inputs.map((entry, i) => (
							<div class="form-row" key={entry.id}>
								<div class="col-md-4" key={i}>
									<label for={`var${i}_key`}>Name</label>
									<input
										style="h-30p"
										value={entry.key}
										id={`var${i}_key`}
										name={`var${i}_key`}
										onChange={(ent) => updateKey(i, ent)}
									/>
								</div>
								<div class="col-md-5" key={i}>
									<label for={`var${i}_val`}>Value</label>
									<input
										style="h-30p"
										value={entry.val}
										id={`var${i}_val`}
										name={`var${i}_val`}
										onChange={(ent) => updateValue(i, ent)}
									/>
								</div>
								<button
									class="col-md-2 btn btn-danger btn-sm"
									style="margin-top: 32px !important; height: 37%;"
									onClick={(e) => removeInputs(e, entry.id)}
								>
									remove
								</button>
							</div>
						))}
					</div>
					<div class="right mt-2">
						<button
							class="rounded btn-primary btn-large mr-2"
							onClick={(e) => addInputs(e)}
						>
							Add
						</button>
						<button
							class="rounded btn-primary btn-large"
							type="submit"
							onClick={(e) => changeVariables(e)}
						>
							Save
						</button>
					</div>
				</form>
			</div>
		</div>
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
	const [showVars, setShowVars] = useState(false);

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
				<div class="element-title">{element.title}</div>
			</div>
			<button
				class="rounded btn-dark btn-sml m-0 mr-1 mt-1 medium"
				onClick={(e) => duplicateElement(e, index)}
			>
				Duplicate
			</button>
			<button
				class="rounded btn-danger btn-sml m-0 mr-1 mt-1 medium"
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
				<span style="display: inline;float: right;">
					<button class="small btn btn-outline-primary" onClick={addElement}>
						New
					</button>
					<button
						style="margin-left: 5px"
						class="small btn btn-outline-primary"
						onClick={(e) => setShowVars(true)}
					>
						Vars
					</button>
				</span>
			</div>
			<div class="element-list">{elementList}</div>

			{showVars ? (
				<VariablesModal
					hide={() => setShowVars(false)}
					dashboard={dashboard}
					slug={slug}
				/>
			) : null}
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
		let defaults = {};

		switch (newType) {
			case "check-svg":
				defaults = CheckSVGDefaults;
				break;
			case "check-line":
				defaults = CheckLineDefaults;
				break;
			case "dynamic-text":
				defaults = DynamicTextDefaults;
				break;
			case "static-text":
				defaults = StaticTextDefaults;
				break;
			case "static-ticker":
				defaults = StaticTickerDefaults;
				break;
			case "static-svg":
				defaults = StaticSVGDefaults;
				break;
		}

		const tickerRect = {
			x: 0,
			y: 82.84371327849588,
			w: 100,
			h: 16,
		};

		if (newType == "static-ticker") {
			updateElement({
				...selectedElement,
				type: newType,
				rect: tickerRect,
				options: Object.assign(selectedElement.options, defaults),
			});
			return;
		}

		updateElement({
			...selectedElement,
			type: newType,
			options: Object.assign(selectedElement.options, defaults),
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
	if (selectedElement.type === "digital-clock") {
		ElementOptions = (
			<CheckDigitalClockOptions
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
					<div class="lefty-righty spacer">
						<h3 class="no-margin">{selectedElement.title}</h3>
						<svg
							class="feather"
							onClick={(e) => removeParam("selectedElementId")}
						>
							<use xlinkHref={`/res/svgs/feather-sprite.svg#x`} />
						</svg>
					</div>
					<div class="settings">
						<label for="name">Name</label>
						<input
							class="form-control"
							id="name"
							type="text"
							placeholder="Cool Element"
							value={selectedElement.title}
							onInput={(e) =>
								updateElement({
									...selectedElement,
									title: e.currentTarget.value,
								})
							}
						/>

						<label>Visual Type</label>
						<select
							class="form-control"
							name="item-type"
							value={selectedElement.type}
							onInput={updateType}
						>
							<option value="check-card">Icinga Card</option>
							<option value="digital-clock">Digital Clock</option>
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
						</select>
						<hr />

						{ElementOptions}
					</div>
				</div>
			</div>
		</div>
	);
}