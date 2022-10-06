import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export function Clock({ options, dashboard }) {
	const [clock, setClock] = useState("");

	const format24h = "HH:mm:ss";
	useEffect(() => {
		setClock(dayjs.tz(dayjs(), options.timeZone).format(format24h));
		const interval = setInterval(() => {
			setClock(dayjs.tz(dayjs(), options.timeZone).format(format24h));
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div class="check-content clock align-center">
			<time
				style={`font-size: ${options.statusFontSize}px; color: ${options.fontColor};`}
			>
				{clock}
			</time>
		</div>
	);
}

export function ClockOptions({ options, updateOptions }) {
	const { locale, timezone } = Intl.DateTimeFormat().resolvedOptions();
	const [timeZone, setTimeZone] = useState(options.timeZone || timezone);
	const handleSelectTimeZone = (e) => {
		setTimeZone(e.currentTarget.value);
		updateOptions({ locale: locale, timeZone: e.currentTarget.value });
	};

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};

	const timezones = Intl.supportedValuesOf("timeZone");
	return (
		<div class="clock-options">
			<label for="time-zone-list">Timezone</label>
			<select
				class="form-select"
				name="item-type"
				value={timeZone}
				onChange={(e) => handleSelectTimeZone(e)}
			>
				{timezones.map((option, index) => (
					<option key={index} value={option}>
						{option}
					</option>
				))}
			</select>
			<label for="status-font-size">Font Size</label>
			<input
				class="form-control"
				id="status-font-size"
				value={options.statusFontSize}
				name="font-size"
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
