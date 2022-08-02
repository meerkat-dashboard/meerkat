import { h, Fragment } from "preact";
import { useState, useEffect, useCallback, useMemo } from "preact/hooks";

import * as meerkat from "../meerkat";
import {
	icingaResultCodeToCheckState,
	getCheckData,
} from "../util";

import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);



function useCheckDigitalClock({ options, dashboard }) {
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

export function CheckDigitalClock({ options, dashboard }) {

	const [checkState, acknowledged, checkValue] = useCheckDigitalClock({
		options,
		dashboard
	});
	
	const [clock, setClock] = useState('');

	useEffect(() => {

		const clockId = setInterval(()=> {
			let now = dayjs();
			setClock(dayjs.tz(now, options.timeZone).format('hh:mm:ss A'));
		}, 1000);

		return () => clearInterval(clockId);
	}, []);
	
	return (
		<div class='digital-clock align-center'>
			<p style={`font-size: ${options.statusFontSize}px; color: ${options.fontColor};`}>
				{clock}
				<br />

			</p>
		</div>
	);
}

export function CheckDigitalClockOptions({ options, updateOptions }) {

	const { locale, timezone } = Intl.DateTimeFormat().resolvedOptions();
	const [  timeZone, setTimeZone] = useState(options.timeZone || timezone)
	const handleSelectTimeZone = e => {
		setTimeZone(e.currentTarget.value);
		updateOptions({ locale: locale, timeZone: e.currentTarget.value });
	}

	const listTimezones = Intl.supportedValuesOf('timeZone');

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};

	return (
		<div class="digital-clock-options">
			<h3>Digital Clock Options</h3>
			<br />
			<label for="time-zone-list">Select a Time Zone</label>
			<select
				class="form-control"
				name="item-type"
				value={timeZone}
				onChange={e => handleSelectTimeZone(e)}
			>
				 {listTimezones.map((option, index) => (
					<option key={index} value={option}>
						{option}
					</option>
				))}
			</select>
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
			<label for="font-color">
				Font Color <a onClick={(e) => clearField(e, "fontColor")}>clear</a>
			</label>
			<div class="lefty-righty spacer">
				<input
					class="form-control"
					id="font-color"
					name="font-color"
					type="color"
					value={options.fontColor}
					onInput={(e) => updateOptions({ fontColor: e.currentTarget.value })}
				/>
				<input
					class="form-control"
					type="text"
					value={options.fontColor}
					disabled
				/>
			</div>
		</div>
	);
}