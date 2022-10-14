import { h, Fragment } from "preact";
import { useState, useEffect, useCallback, useMemo } from "preact/hooks";

import * as meerkat from "../meerkat";
import {
	icingaResultCodeToCheckState,
	IcingaCheckList,
	getCheckData,
} from "../util";
import { FontSizeInput, ExternalURL } from "./options";

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

function CheckState(state, acknowledged) {
	if (acknowledged) {
		return (
			<Fragment>
				{state}
				<span>(ACK)</span>
			</Fragment>
		);
	}
	return {state};
}

export function CheckCard({ options, dashboard }) {
	const [checkState, acknowledged, checkValue] = useCheckCard({
		options,
		dashboard,
	});

	if (checkValue === "useCheckState") {
		return (
			<div
				class={`check-content card ${checkState} ${checkState}-${acknowledged}`}
			>
				<div
					class="check-state"
					style={`font-size: ${options.statusFontSize}px`}
				>
					<CheckState state={checkState} acknowledged={acknowledged} />
				</div>
			</div>
		);
	}
	return (
		<div
			class={`check-content card ${checkState} ${checkState}-${acknowledged}`}
		>
			<div class="check-state" style={`font-size: ${options.statusFontSize}px`}>
				checkValue
			</div>
		</div>
	);
}

export function CheckCardOptions({ options, updateOptions }) {
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
			<FontSizeInput
				value={options.statusFontSize}
				onInput={(e) =>
					updateOptions({ statusFontSize: Number(e.currentTarget.value) })
				}
			/>
			<CheckDataOptions options={options} updateOptions={updateOptions} />
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

	const handleInput = (e) => updateOptions({ [e.target.name]: e.target.value });
	let input = (
		<NoMatchInput
			value={options.checkDataDefault}
			onInput={handleInput}
		/>
	);
	if (options.checkDataSelection == "pluginOutput") {
		input = (
			<RegexpInput
				expr={options.checkDataPattern}
				nomatch={options.checkDataDefault}
				onInput={handleInput}
			/>
		);
	}

	return optionsSpec.length === 0 ? (
		<label for="check-data-mode">No Check Data Available</label>
	) : (
		<Fragment>
			<label for="check-data-mode">Check Data Mode</label>
			<select
				class="form-select"
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
			{input}
		</Fragment>
	);
};

function RegexpInput({ expr, nomatch, onInput }) {
	return (
		<fieldset>
			<label class="form-label mt-1" for="check-data-regexp">
				Regular expression
			</label>
			<input
				class="form-control mb-1"
				id="check-data-regexp"
				name="checkDataPattern"
				type="text"
				placeholder="[0-9]+"
				onInput={onInput}
				value={expr}
			/>
			<NoMatchInput value={nomatch} onInput={onInput} />
			<small class="form-text">
				If the regular expression results in no matches, this value will be displayed.
			</small>
		</fieldset>
	);
}

function NoMatchInput({ value, onInput }) {
	return (
		<Fragment>
			<label class="form-label mt-1" for="check-data-nomatch">
				Value on no match
			</label>
			<input
				class="form-control mb-1"
				id="check-data-nomatch"
				name="checkDataNomatch"
				type="text"
				placeholder="Hello, world!"
				onInput={onInput}
				value={nomatch}
			/>
		</Fragment>
	);
}
