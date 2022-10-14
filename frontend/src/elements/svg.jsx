import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import {
	icingaResultCodeToCheckState,
	IcingaCheckList,
} from "../util";
import { svgList } from "../svg-list";
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
		<div class="card-options">
			<IcingaCheckList
				currentCheckopts={options}
				updateOptions={updateOptions}
			/>
			<br />
			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="okSvg">OK SVG</label>
			<select
				class="form-select"
				id="okSvg"
				name="okSvg"
				value={options.okSvg}
				onInput={(e) => updateOptions({ okSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>
			<label for="ok-stroke-color">
				OK Stroke color{" "}
				<a onClick={(e) => clearField(e, "okStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="ok-stroke-color"
					id="ok-stroke-color"
					value={options.okStrokeColor}
					onInput={(e) =>
						updateOptions({ okStrokeColor: e.currentTarget.value })
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.okStrokeColor}
					disabled
				/>
			</div>
			<hr />

			<label for="warningSvg">Warning SVG</label>
			<select
				class="form-select"
				id="warningSvg"
				name="warningSvg"
				value={options.warningSvg}
				onInput={(e) => updateOptions({ warningSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>
			<label for="warning-stroke-color">
				Warning Stroke color{" "}
				<a onClick={(e) => clearField(e, "warningStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="warning-stroke-color"
					id="warning-stroke-color"
					value={options.warningStrokeColor}
					onInput={(e) =>
						updateOptions({ warningStrokeColor: e.currentTarget.value })
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.warningStrokeColor}
					disabled
				/>
			</div>
			<label for="warning-stroke-color">
				Warning Acknowledged Stroke color{" "}
				<a onClick={(e) => clearField(e, "warningStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="warning-stroke-color"
					id="warning-stroke-color"
					value={options.warningAcknowledgedStrokeColor}
					onInput={(e) =>
						updateOptions({
							warningAcknowledgedStrokeColor: e.currentTarget.value,
						})
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.warningAcknowledgedStrokeColor}
					disabled
				/>
			</div>
			<hr />

			<label for="unknownSvg">Unknown SVG</label>
			<select
				class="form-select"
				id="unknownSvg"
				name="unknownSvg"
				value={options.unknownSvg}
				onInput={(e) => updateOptions({ unknownSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>
			<label for="unknown-stroke-color">
				Unknown Stroke color{" "}
				<a onClick={(e) => clearField(e, "unknownStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="unknown-stroke-color"
					id="unknown-stroke-color"
					value={options.unknownStrokeColor}
					onInput={(e) =>
						updateOptions({ unknownStrokeColor: e.currentTarget.value })
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.unknownStrokeColor}
					disabled
				/>
			</div>
			<label for="unknown-stroke-color">
				Unknown Acknowledged Stroke color{" "}
				<a onClick={(e) => clearField(e, "unknownStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="unknown-stroke-color"
					id="unknown-stroke-color"
					value={options.unknownAcknowledgedStrokeColor}
					onInput={(e) =>
						updateOptions({
							unknownAcknowledgedStrokeColor: e.currentTarget.value,
						})
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.unknownAcknowledgedStrokeColor}
					disabled
				/>
			</div>
			<hr />

			<label for="criticalSvg">Critical SVG</label>
			<select
				class="form-select"
				id="criticalSvg"
				name="criticalSvg"
				value={options.criticalSvg}
				onInput={(e) => updateOptions({ criticalSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>
			<label for="critical-stroke-color">
				Critical Stroke color{" "}
				<a onClick={(e) => clearField(e, "criticalStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="critical-stroke-color"
					id="critical-stroke-color"
					value={options.criticalStrokeColor}
					onInput={(e) =>
						updateOptions({ criticalStrokeColor: e.currentTarget.value })
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.criticalStrokeColor}
					disabled
				/>
			</div>
			<label for="critical-stroke-color">
				Critical Acknowledged Stroke color{" "}
				<a onClick={(e) => clearField(e, "criticalStrokeColor")}>clear</a>
			</label>
			<div class="left spacer">
				<input
					type="color"
					name="critical-stroke-color"
					id="critical-stroke-color"
					value={options.criticalAcknowledgedStrokeColor}
					onInput={(e) =>
						updateOptions({
							criticalAcknowledgedStrokeColor: e.currentTarget.value,
						})
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.criticalAcknowledgedStrokeColor}
					disabled
				/>
			</div>
			<br />
			<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>
				{showAdvanced ? "Hide Options" : "Advanced Options"}
			</button>
			<AdvancedSVGOptions
				options={options}
				updateOptions={updateOptions}
				display={showAdvanced}
			/>
		</div>
	);
}

export function CheckSVG({ options, dashboard }) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	const updateState = async () => {
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(
					options.objectType,
					options.filter,
					dashboard
				);
				if (res === false)
					window.flash(`This dashboard isn't updating`, "error");
				res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
				setCheckState(
					icingaResultCodeToCheckState(options.objectType, res.MaxState)
				);
			} catch (error) {
				window.flash("This dashboard isn't updating", "error");
			}
		}
	};

	useEffect(() => {
		if (options.objectType !== null && options.filter != null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30 * 1000);
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	let styles = "";
	let svgName = "";

	if (checkState === "ok" || checkState === "up") {
		styles = options.okStrokeColor ? `stroke: ${options.okStrokeColor}` : "";
		svgName = options.okSvg;
	}

	if (checkState === "warning") {
		let warningStroke =
			acknowledged !== ""
				? options.warningAcknowledgedStrokeColor
				: options.warningStrokeColor;
		styles = options.warningStrokeColor ? `stroke: ${warningStroke}` : "";
		svgName = options.warningSvg;
	}

	if (checkState === "unknown") {
		let unknownStroke =
			acknowledged !== ""
				? options.unknownAcknowledgedStrokeColor
				: options.unknownStrokeColor;
		styles = options.unknownStrokeColor ? `stroke: ${unknownStroke}` : "";
		svgName = options.unknownSvg;
	}

	if (checkState === "critical" || checkState === "down") {
		let criticalStroke =
			acknowledged !== ""
				? options.criticalAcknowledgedStrokeColor
				: options.criticalStrokeColor;
		styles = options.criticalStrokeColor ? `stroke: ${criticalStroke}` : "";
		svgName = options.criticalSvg;
	}

	return (
		<div class="check-content svg">
			<svg class="feather" style={styles}>
				<use xlinkHref={`/res/svgs/feather-sprite.svg#${svgName}`} />
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
