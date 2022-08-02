import { h, Fragment } from "preact";
import { useState, useEffect, useCallback, useMemo } from "preact/hooks";

import * as meerkat from "../meerkat";
import {
	icingaResultCodeToCheckState,
	IcingaCheckList,
	getCheckData,
	alertSounds,
	debounce,
} from "../util";

function useCheckCard({ options, dashboard }) {
	const [checkState, setCheckState] = useState(null);
	const [checkValue, setCheckValue] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	const extractAndSetCheckValue = useCallback(
		(checkData) => {
			let newCheckValue = options.checkDataDefault || "useCheckState";

			// extract and use plugin output
			if (
				options.checkDataSelection === "pluginOutput" &&
				checkData.pluginOutput
			) {
				//console.log('Plugin Output:', checkData.pluginOutput)

				if (options.checkDataPattern) {
					try {
						const pattern = new RegExp(options.checkDataPattern, "im");
						const extractedValues = checkData.pluginOutput.match(pattern);
						if (extractedValues) {
							newCheckValue =
								extractedValues.length > 1
									? extractedValues[extractedValues.length - 1]
									: extractedValues[0];
						}
					} catch (e) {
						// catch invalid regexp
						console.error(e);
					}
				} else if (!options.checkDataDefault) {
					newCheckValue = checkData.pluginOutput;
				}

				// extract and use performance data
			} else if (options.checkDataSelection && checkData.performance) {
				const value = checkData.performance[options.checkDataSelection];

				if (value) {
					newCheckValue = Number(value.replace(/[^\d.-]/g, ""));
				}
			}

			setCheckValue(newCheckValue);
		},
		[
			options.checkDataSelection,
			options.checkDataPattern,
			options.checkDataDefault,
		]
	);

	const updateCheckState = useCallback(async () => {
		getCheckData(options, extractAndSetCheckValue);

		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(
					options.objectType,
					options.filter,
					dashboard
				);
				res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
				setCheckState(
					icingaResultCodeToCheckState(options.objectType, res.MaxState)
				);
			} catch (error) {
				window.flash(`This dashboard isn't updating: ${error}`, "error");
			}
		}
	}, [options.objectType, options.filter, extractAndSetCheckValue]);

	useEffect(() => {
		if (options.objectType !== null && options.filter !== null) {
			setCheckValue(null);
			updateCheckState();
			const intervalID = window.setInterval(updateCheckState, 30 * 1000);
			return () => window.clearInterval(intervalID);
		}
	}, [updateCheckState]);

	return [checkState, acknowledged, checkValue];
}
export function CheckCard({ options, dashboard }) {
	const [checkState, acknowledged, checkValue] = useCheckCard({
		options,
		dashboard,
	});

	alertSounds(checkState, options, dashboard, false);

	return (
		<div
			class={`check-content card ${checkState} ${checkState}-${acknowledged}`}
		>
			<div
				class="check-state"
				style={`font-size: ${options.statusFontSize}px; line-height: 1.1;`}
			>
				{checkValue === "useCheckState" ? (
					<div class="align-center">{checkState}</div>
				) : (
					checkValue
				)}
				{acknowledged ? <span>(ACK)</span> : ""}
			</div>
		</div>
	);
}

export function CheckCardOptions({ options, updateOptions }) {
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
			<label for="card-linking-url">Linking Url</label>
			<input
				class="form-control"
				id="card-linking-url"
				name="card-linking-url"
				type="text"
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			></input>
			<label for="status-font-size">Status Font Size</label>
			<input
				class="form-control"
				id="status-font-size"
				value={options.statusFontSize}
				name="status-font-size"
				type="number"
				min="0"
				onInput={(e) =>
					updateOptions({ statusFontSize: Number(e.currentTarget.value) })
				}
			/>
			<CheckDataOptions options={options} updateOptions={updateOptions} />
			<div></div>
			<button
				class="rounded btn-primary btn-large mt-2"
				onClick={onClickAdvanced}
			>
				{showAdvanced ? "Hide Options" : "Advanced Options"}
			</button>
			<AdvancedCheckOptions
				options={options}
				updateOptions={updateOptions}
				display={showAdvanced}
			/>
		</div>
	);
}

const CheckDataOptions = ({ options, updateOptions }) => {
	const [checkData, setCheckData] = useState({});

	useEffect(() => getCheckData(options, setCheckData), [options.id]);

	const optionsSpec = useMemo(() => {
		const result = [];

		if (checkData.performance) {
			Object.keys(checkData.performance).forEach((name) =>
				result.push({
					key: name,
					value: name,
					text: `Performance ${name.toUpperCase()}`,
					selected: options.checkDataSelection === name,
				})
			);
		}
		if (checkData.pluginOutput) {
			result.push({
				key: "pluginOutput",
				value: "pluginOutput",
				text: "Plugin Output",
				selected: options.checkDataSelection === "pluginOutput",
			});
		}

		return result;
	}, [checkData.performance, checkData.pluginOutput]);

	return optionsSpec.length === 0 ? (
		<label for="check-data-mode">No Check Data Available</label>
	) : (
		<Fragment>
			<label for="check-data-mode">Check Data Mode</label>
			<select
				id="check-data-mode"
				onInput={(e) =>
					updateOptions({ checkDataSelection: e.currentTarget.value })
				}
			>
				<option>Choose away...</option>
				{optionsSpec.map((spec) => (
					<option key={spec.key} value={spec.value} selected={spec.selected}>
						{spec.text}
					</option>
				))}
			</select>
			{options.checkDataSelection === "pluginOutput" ? (
				<div>
					<input
						class="form-control mb-1"
						name="checkDataPattern"
						type="text"
						title="Regexp Pattern"
						placeholder="Enter regexp pattern"
						onInput={debounce(
							(e) => updateOptions({ [e.target.name]: e.target.value }),
							300
						)}
						value={options.checkDataPattern}
					/>
				</div>
			) : null}
			{options.checkDataSelection ? (
				<div>
					<input
						class="form-control mb-2"
						name="checkDataDefault"
						type="text"
						title="Check data default value"
						placeholder="Enter default value for check data"
						onInput={debounce(
							(e) => updateOptions({ [e.target.name]: e.target.value }),
							300
						)}
						value={options.checkDataDefault}
					/>
				</div>
			) : null}
		</Fragment>
	);
};

const AdvancedCheckOptions = ({ options, updateOptions, display }) => {
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
					]
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
