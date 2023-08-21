import { h, Fragment } from "preact";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";

import { svgList } from "../svg-list";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
import * as meerkat from "../meerkat";
import { ExternalURL } from "./options";

export function CheckSVGOptions({ options, updateOptions }) {
	const svgOptions = svgList.map((svgName) => (
		<option value={svgName}>{svgName}</option>
	));
	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};
	return (
		<Fragment>
			<Icinga.ObjectSelect
				objectType={options.objectType}
				objectName={options.objectName}
				updateOptions={updateOptions}
			/>

			<hr />

			<label class="form-label" for="okSVG">
				Ok SVG
			</label>
			<select
				onChange={(e) => updateOptions({ okSvg: e.target.value })}
				class="form-select"
				id="okSVG"
				name="okSVG"
				value={options.okSvg}
				aria-label="Ok SVG select"
			>
				{svgOptions}
			</select>
			<label for="ok-stroke-color">
				Ok Stroke Color{" "}
				<a onClick={(e) => clearField(e, "okStrokeColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="ok-stroke-color"
						name="ok-stroke-color"
						type="color"
						value={options.okStrokeColor}
						onInput={(e) =>
							updateOptions({ okStrokeColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.okStrokeColor}
					disabled
				></input>
			</div>

			<hr />

			<label for="warningSvg">Warning SVG</label>
			<select
				onChange={(e) => updateOptions({ warningSvg: e.target.value })}
				class="form-select"
				id="warningSvg"
				name="warningSvg"
				value={options.warningSvg}
				aria-label="Warning SVG select"
			>
				{svgOptions}
			</select>
			<label for="warning-stroke-color">
				Warning Stroke Color{" "}
				<a onClick={(e) => clearField(e, "warningStrokeColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="warning-stroke-color"
						name="warning-stroke-color"
						type="color"
						value={options.warningStrokeColor}
						onInput={(e) =>
							updateOptions({ warningStrokeColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.warningStrokeColor}
					disabled
				></input>
			</div>

			<label for="warning-ack-stroke-color">
				Warning Acknowledged Stroke Color{" "}
				<a onClick={(e) => clearField(e, "warningAcknowledgedStrokeColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="warning-ack-stroke-color"
						name="warning-ack-stroke-color"
						type="color"
						value={options.warningAcknowledgedStrokeColor}
						onInput={(e) =>
							updateOptions({
								warningAcknowledgedStrokeColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.warningAcknowledgedStrokeColor}
					disabled
				></input>
			</div>

			<hr />

			<label for="unknownSvg">Unknown SVG</label>
			<select
				onChange={(e) => updateOptions({ unknownSvg: e.target.value })}
				class="form-select"
				id="unknownSvg"
				name="unknownSvg"
				value={options.unknownSvg}
				aria-label="Unknown SVG select"
			>
				{svgOptions}
			</select>
			<label for="unknown-stroke-color">
				Unknown Stroke Color{" "}
				<a onClick={(e) => clearField(e, "unknownStrokeColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="unknown-stroke-color"
						name="unknown-stroke-color"
						type="color"
						value={options.unknownStrokeColor}
						onInput={(e) =>
							updateOptions({ unknownStrokeColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.unknownStrokeColor}
					disabled
				></input>
			</div>

			<label for="unknown-ack-stroke-color">
				Unknown Acknowledged Stroke Color{" "}
				<a onClick={(e) => clearField(e, "unknownAcknowledgedStrokeColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="unknown-ack-stroke-color"
						name="unknown-ack-stroke-color"
						type="color"
						value={options.unknownAcknowledgedStrokeColor}
						onInput={(e) =>
							updateOptions({
								unknownAcknowledgedStrokeColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.unknownAcknowledgedStrokeColor}
					disabled
				></input>
			</div>

			<hr />

			<label for="criticalSvg">Critical SVG</label>
			<select
				onChange={(e) => updateOptions({ criticalSvg: e.target.value })}
				class="form-select"
				id="criticalSvg"
				name="criticalSvg"
				value={options.criticalSvg}
				aria-label="Critical SVG select"
			>
				{svgOptions}
			</select>
			<label for="critical-stroke-color">
				Critical Stroke Color{" "}
				<a onClick={(e) => clearField(e, "criticalStrokeColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="critical-stroke-color"
						name="critical-stroke-color"
						type="color"
						value={options.criticalStrokeColor}
						onInput={(e) =>
							updateOptions({ criticalStrokeColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.criticalStrokeColor}
					disabled
				></input>
			</div>

			<label for="critical-ack-stroke-color">
				Critical Acknowledged Stroke Color{" "}
				<a onClick={(e) => clearField(e, "criticalAcknowledgedStrokeColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="critical-ack-stroke-color"
						name="critical-ack-stroke-color"
						type="color"
						value={options.criticalAcknowledgedStrokeColor}
						onInput={(e) =>
							updateOptions({
								criticalAcknowledgedStrokeColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.criticalAcknowledgedStrokeColor}
					disabled
				></input>
			</div>

			<hr />

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>
			<Icinga.SoundOptions options={options} updateOptions={updateOptions} />
		</Fragment>
	);
}

export function CheckSVG({ events, options, dashboard }) {
	const [objectState, setObjectState] = useState();
	const [cardState, setCardState] = useState();
	const [soundEvent, setSoundEvent] = useState(false);
	const [styles, setStyles] = useState("");
	const [svg, setSVG] = useState();

	const parseUpdate = (object) => {
		let state = IcingaJS.StateText(object.state, options.objectType);
		let classes = ["feather", "svg", state];
		setCardState(classes.join(" "));

		let acknowledged = "";
		let svg = "help-circle";
		let styles = "";

		object.acknowledged ? (acknowledged = "ack") : (acknowledged = "");

		if (state === "ok" || state === "up") {
			styles = options.okStrokeColor ? `stroke: ${options.okStrokeColor}` : "";
			svg = options.okSvg;
		}

		if (state === "warning") {
			let warningStroke =
				acknowledged !== ""
					? options.warningAcknowledgedStrokeColor
					: options.warningStrokeColor;
			styles = options.warningStrokeColor ? `stroke: ${warningStroke}` : "";
			svg = options.warningSvg;
		}

		if (state === "unknown") {
			let unknownStroke =
				acknowledged !== ""
					? options.unknownAcknowledgedStrokeColor
					: options.unknownStrokeColor;
			styles = options.unknownStrokeColor ? `stroke: ${unknownStroke}` : "";
			svg = options.unknownSvg;
		}

		if (state === "critical" || state === "down") {
			let criticalStroke =
				acknowledged !== ""
					? options.criticalAcknowledgedStrokeColor
					: options.criticalStrokeColor;
			styles = options.criticalStrokeColor ? `stroke: ${criticalStroke}` : "";
			svg = options.criticalSvg;
		}
		setStyles(styles);
		setSVG(svg);
	};

	const handleUpdate = () => {
		try {
			if (options.objectType.endsWith("group")) {
				meerkat
					.getAllInGroup(options.objectName, options.objectType)
					.then((data) => {
						let worst = IcingaJS.worstObject(data);
						setObjectState(worst);
						parseUpdate(worst);
					});
			} else if (options.objectType.endsWith("filter")) {
				meerkat
					.getAllFilter(options.objectName, options.objectType)
					.then((data) => {
						let worst = IcingaJS.worstObject(data);
						setObjectState(worst);
						parseUpdate(worst);
					});
			} else {
				meerkat
					.getIcingaObject(options.objectName, options.objectType)
					.then((data) => {
						setObjectState(data);
						parseUpdate(data);
					});
			}
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	};

	const handleEvent = useCallback(async (event) => {
		let objects = await meerkat.handleJSONList(JSON.parse(event.data));
		for (let i = 0; i < objects.length; i++) {
			if (objectState && objects[i].element == options.objectName) {
				let obj = objects[i];
				if (
					objects.length > 0 &&
					(options.objectType.endsWith("group") ||
						options.objectType.endsWith("filter"))
				) {
					obj = IcingaJS.worstObject(objects);
				}
				setObjectState(obj);
				parseUpdate(obj);

				setSoundEvent(true);
				return;
			}
		}
	});

	useEffect(() => {
		if (!objectState) handleUpdate();
		events.addEventListener("StateChange", handleEvent);
		return () => {
			events.removeEventListener("StateChange", handleEvent);
		};
	}, [handleEvent]);

	useEffect(() => {
		if (objectState) handleUpdate(objectState);
	}, [
		options.objectName,
		options.objectType,
		options.okSvg,
		options.okStrokeColor,
		options.warningSvg,
		options.warningStrokeColor,
		options.warningAcknowledgedStrokeColor,
		options.unknownSvg,
		options.unknownStrokeColor,
		options.unknownAcknowledgedStrokeColor,
		options.criticalSvg,
		options.criticalStrokeColor,
		options.criticalAcknowledgedStrokeColor,
	]);

	if (objectState && dashboard) {
		if (soundEvent) IcingaJS.alertSounds(objectState.state, options, dashboard);
	}

	return (
		<div class={`check-content svg`}>
			<svg class={cardState} style={styles}>
				<use xlinkHref={`/dist/feather-sprite.svg#${svg}`} />
			</svg>
		</div>
	);
}

export const CheckSVGDefaults = {
	okSvg: "check-circle",
	okStrokeColor: "#0ee16a",
	warningSvg: "alert-triangle",
	warningStrokeColor: "#ff9000",
	warningAcknowledgedStrokeColor: "#ffca39",
	unknownSvg: "help-circle",
	unknownStrokeColor: "#970ee1",
	unknownAcknowledgedStrokeColor: "#b594b5",
	criticalSvg: "alert-octagon",
	criticalStrokeColor: "#ff0019",
	criticalAcknowledgedStrokeColor: "#de5e84",
};
