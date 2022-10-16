import { h, Fragment } from "preact";

import { FontSizeInput } from "../elements/options";

export function StaticTickerOptions({ options, updateOptions }) {
	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};

	return (
		<Fragment>
			<label for="text">Text</label>
			<textarea
				class="form-control"
				id="text"
				name="text"
				value={options.text}
				onInput={(e) => updateOptions({ text: e.currentTarget.value })}
			></textarea>

			<label for="scroll-period">Scroll Period</label>
			<input
				class="form-control"
				id="scroll-period"
				name="scroll-period"
				type="number"
				min="1"
				max="200"
				value={options.scrollPeriod}
				onInput={(e) => updateOptions({ scrollPeriod: e.currentTarget.value })}
			/>

			<FontSizeInput
				value={options.fontSize}
				onInput={(e) =>
					updateOptions({ fontSize: Number(e.currentTarget.value) })
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

			<label for="background-color">
				Background Color{" "}
				<a onClick={(e) => clearField(e, "backgroundColor")}>clear</a>
			</label>
			<div class="lefty-righty spacer">
				<input
					class="form-control"
					id="background-color"
					name="background-color"
					type="color"
					value={options.backgroundColor}
					onInput={(e) =>
						updateOptions({ backgroundColor: e.currentTarget.value })
					}
				/>
				<input
					class="form-control"
					type="text"
					value={options.backgroundColor}
					disabled
				/>
			</div>
		</Fragment>
	);
}

export function StaticTicker({ options }) {
	let styles = "";
	let textStyles = "";

	if (typeof options.fontSize !== "undefined") {
		textStyles += `font-size: ${options.fontSize}px; `;
	}
	if (typeof options.backgroundColor !== "undefined") {
		styles += `background-color: ${options.backgroundColor}; `;
	}
	if (typeof options.fontColor !== "undefined") {
		textStyles += `color: ${options.fontColor}; `;
	}
	if (typeof options.scrollPeriod !== "undefined") {
		textStyles += `animation: marqueeX ${options.scrollPeriod}s linear infinite;`;
	}

	return (
		<div class="check-content ticker" style={styles}>
			<div class="scrolling-text" style={textStyles}>
				{options.text}
			</div>
		</div>
	);
}

export const StaticTickerDefaults = {
	text: "sample message",
	fontSize: "22",
	fontColor: "#ffffff",
	backgroundColor: "#007bff",
	scrollPeriod: "15",
};
