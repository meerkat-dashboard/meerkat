import { h, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

import * as meerkat from "../meerkat";
import { icingaResultCodeToCheckState, IcingaCheckList } from "../util";

export function CheckLineOptions({ options, updateOptions }) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () =>
		showAdvanced ? setAdvanced(false) : setAdvanced(true);

	return (
		<div class="card-options">
			<label>Icinga Host or Service</label>
			<IcingaCheckList
				currentCheckopts={options}
				updateOptions={updateOptions}
			/>

			<br />
			<label for="line-linking-url">Linking Url</label>
			<input
				class="form-control"
				id="line-linking-url"
				name="line-linking-url"
				type="text"
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			></input>

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

			<label>Render Arrows</label>
			<div class="left spacer">
				<input
					class="form-control"
					id="left-arrow"
					type="checkbox"
					checked={options.leftArrow}
					onClick={(e) => updateOptions({ leftArrow: e.currentTarget.checked })}
				/>
				<label for="left-arrow" class="no-margin" style="font-weight: normal">
					Left
				</label>
			</div>
			<div class="left spacer">
				<input
					class="form-control"
					id="right-arrow"
					type="checkbox"
					checked={options.rightArrow}
					onClick={(e) =>
						updateOptions({ rightArrow: e.currentTarget.checked })
					}
				/>
				<label for="right-arrow" class="no-margin" style="font-weight: normal">
					Right
				</label>
			</div>
			<br />
			<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>
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

const AdvancedLineOptions = ({ options, updateOptions, display }) => {
	const handleAudioFile = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {};
		opts[fieldName] = res.url;
		updateOptions(opts);
	};

	const audioControls = (src) => {
		if (src) {
			return (
				<Fragment>
					<a target="_blank" href={src}>
						view
					</a>
				</Fragment>
			);
		}
		return null;
	};

	return (
		<div style={{ display: display ? "" : "none" }}>
			<br />
			<label class="status-font-size">Mute Card Alerts</label>
			<span>
				<input
					type="checkbox"
					defaultChecked={options.muteAlerts}
					onChange={(e) => updateOptions({ muteAlerts: e.target.checked })}
					class="form-control mute-sounds"
				/>
			</span>
			<br />
			<br />
			<label for="soundFile">
				Ok Alert Sound {audioControls(options.okSound)}{" "}
				<a onClick={(e) => updateOptions({ okSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="okSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("okSound", e.target.files)}
			></input>
			<label for="soundFile">
				Warning Alert Sound {audioControls(options.warningSound)}{" "}
				<a onClick={(e) => updateOptions({ warningSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="warningSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("warningSound", e.target.files)}
			></input>
			<label for="soundFile">
				Critical Alert Sound {audioControls(options.criticalSound)}{" "}
				<a onClick={(e) => updateOptions({ criticalSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="criticalSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("criticalSound", e.target.files)}
			></input>
			<label for="soundFile">
				Unknown Alert Sound {audioControls(options.unknownSound)}{" "}
				<a onClick={(e) => updateOptions({ unknownSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="unknownSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("unknownSound", e.target.files)}
			></input>
			<label for="soundFile">
				Up Alert Sound {audioControls(options.upSound)}{" "}
				<a onClick={(e) => updateOptions({ upSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="upSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("upSound", e.target.files)}
			></input>
			<label for="soundFile">
				Down Alert Sound {audioControls(options.downSound)}{" "}
				<a onClick={(e) => updateOptions({ downSound: "" })}>default</a>
			</label>
			<input
				type="file"
				id="downSound"
				accept="audio/*"
				placeholder="Upload an audio file"
				onInput={(e) => handleAudioFile("downSound", e.target.files)}
			></input>
		</div>
	);
};

//The rendered view (in the actual dashboard) of the Check SVG
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
