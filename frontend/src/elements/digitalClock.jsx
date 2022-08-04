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


export function CheckDigitalClock({ options, dashboard }) {

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