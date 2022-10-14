import { h, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

import * as meerkat from "../meerkat";
import { icingaResultCodeToCheckState, IcingaCheckList } from "../util";
import { ExternalURL } from "./options";

export function CheckLineOptions({ options, updateOptions }) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () =>
		showAdvanced ? setAdvanced(false) : setAdvanced(true);

	return (
		<div class="card-options">
			<IcingaCheckList
				currentCheckopts={options}
				updateOptions={updateOptions}
			/>

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="stroke-width">Stroke width</label>
			<input
				class="form-control"
				id="stroke-width"
				name="stroke-width"
				type="number"
				min="0"
				step="any"
				value={options.strokeWidth}
				onInput={(e) =>
					updateOptions({ strokeWidth: Number(e.currentTarget.value) })
				}
			/>

			<fieldset>
				<legend>Arrowheads</legend>
				<div class="form-check">
					<input
						class="form-check-input"
						id="left-arrow"
						type="checkbox"
						checked={options.leftArrow}
						onClick={(e) =>
							updateOptions({ leftArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="left-arrow">
						Left
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						id="right-arrow"
						type="checkbox"
						checked={options.rightArrow}
						onClick={(e) =>
							updateOptions({ rightArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="right-arrow">
						Right
					</label>
				</div>
			</fieldset>
			<button class="btn btn-secondary" onClick={onClickAdvanced}>
				{showAdvanced ? "Hide Options" : "Advanced Options"}
			</button>
			<AdvancedLineOptions
				options={options}
				updateOptions={updateOptions}
				display={showAdvanced}
			/>
		</div>
	);
}

export function CheckLine({ options, dashboard, slug }) {
	const svgRef = useRef({ clientWidth: 100, clientHeight: 40 });
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
		if (options.objectType !== null && options.filter !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30 * 1000);
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	let strokeColor = "";

	if (checkState === "ok" || checkState === "up") {
		strokeColor = `var(--color-icinga-green)`;
	}
	if (checkState === "warning") {
		strokeColor = acknowledged ? `#ffca39` : `var(--color-icinga-yellow)`;
	}
	if (checkState === "unknown") {
		strokeColor = acknowledged ? `#b594b5` : `var(--color-icinga-purple)`;
	}
	if (checkState === "critical" || checkState === "down") {
		strokeColor = acknowledged ? `#de5e84` : `var(--color-icinga-red)`;
	}

	return (
		<div class="check-content svg" ref={svgRef}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox={`0 0 ${svgRef.current.clientWidth} ${svgRef.current.clientHeight}`}
				fill="none"
				stroke={strokeColor}
				stroke-width={options.strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line
					x1="5"
					y1={svgRef.current.clientHeight / 2}
					x2={svgRef.current.clientWidth - 5}
					y2={svgRef.current.clientHeight / 2}
				></line>
				{options.leftArrow ? (
					<polyline
						points={`30 5 5 ${svgRef.current.clientHeight / 2} 30 ${
							svgRef.current.clientHeight - 5
						}`}
					></polyline>
				) : null}
				{options.rightArrow ? (
					<polyline
						points={`${svgRef.current.clientWidth - 30} 5 ${
							svgRef.current.clientWidth - 5
						} ${svgRef.current.clientHeight / 2} ${
							svgRef.current.clientWidth - 30
						} ${svgRef.current.clientHeight - 5}`}
					></polyline>
				) : null}
			</svg>
		</div>
	);
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true,
};
