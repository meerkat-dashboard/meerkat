import { h, Fragment } from "preact";

import {
	FontSizeInput,
	ExternalURL,
	AlignmentInput,
} from "../elements/options";

export function StaticTextOptions({ options, updateOptions }) {
	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};

	return (
		<Fragment>
			<label class="form-label" for="text">
				Text
			</label>
			<textarea
				class="form-control"
				id="text"
				value={options.text}
				onInput={(e) => updateOptions({ text: e.currentTarget.value })}
			></textarea>

			<FontSizeInput
				value={options.fontSize}
				onInput={(e) =>
					updateOptions({ fontSize: Number(e.currentTarget.value) })
				}
			/>

			<div class="form-check">
				<input
					class="form-check-input"
					type="checkbox"
					id="bold"
					defaultChecked={options.boldText}
					onChange={(e) => updateOptions({ boldText: e.target.checked })}
				/>
				<label class="form-check-label" for="bold">
					Bold text
				</label>
			</div>

			<AlignmentInput updateOptions={updateOptions} options={options} />

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="font-color">
				Font Color <a onClick={(e) => clearField(e, "fontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="font-color"
						name="font-color"
						type="color"
						value={options.fontColor}
						onInput={(e) => updateOptions({ fontColor: e.currentTarget.value })}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.fontColor}
					disabled
				></input>
			</div>

			<label for="font-color">
				Background Color{" "}
				<a onClick={(e) => clearField(e, "backgroundColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="background-color"
						name="background-color"
						type="color"
						value={options.backgroundColor}
						onInput={(e) =>
							updateOptions({ backgroundColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.backgroundColor}
					disabled
				></input>
			</div>
		</Fragment>
	);
}

export function StaticText({ options }) {
	let styles = "height: 100%; ";
	let text = options.text;

	if (typeof options.fontSize !== "undefined") {
		styles += `font-size: ${options.fontSize}px; `;
	}
	if (typeof options.backgroundColor !== "undefined") {
		styles += `background-color: ${options.backgroundColor}; `;
	}
	if (typeof options.fontColor !== "undefined") {
		styles += `color: ${options.fontColor}; `;
	}
	if (typeof options.textAlign !== "undefined") {
		styles += `justify-content: ${options.textAlign}; `;
	}
	if (typeof options.textVerticalAlign !== "undefined") {
		styles += `align-items: ${options.textVerticalAlign}; `;
	}
	if (typeof options.boldText !== "undefined" && options.boldText) {
		styles += `font-weight: bold; `;
	}

	return (
		<div class="check-content text" style={styles}>
			{text}
		</div>
	);
}

export const StaticTextDefaults = {
	text: "sample message",
	fontSize: "22",
	fontColor: "#ffffff",
	textAlign: "center",
	textVerticalAlign: "center",
	backgroundColor: "#007bff",
};
