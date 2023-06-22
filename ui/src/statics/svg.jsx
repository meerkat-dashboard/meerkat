import { h, Fragment } from "preact";

import { svgList } from "../svg-list";

export function StaticSVGOptions({ options, updateOptions }) {
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
		<Fragment>
			<label for="svg">SVG</label>
			<select
				class="form-select"
				id="svg"
				name="svg"
				value={options.svg}
				onInput={(e) => updateOptions({ svg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>

			<label for="stroke-color">
				Stroke Color <a onClick={(e) => clearField(e, "strokeColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="stroke-color"
						name="stroke-color"
						type="color"
						value={options.strokeColor}
						onInput={(e) =>
							updateOptions({ strokeColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.strokeColor}
					disabled
				></input>
			</div>

			<label for="stroke-width">Stroke width</label>
			<input
				class="form-control"
				id="stroke-width"
				name="stroke-width"
				type="number"
				min="0"
				step="any"
				value={options.strokeWidth}
				onInput={(e) => updateOptions({ strokeWidth: e.currentTarget.value })}
			/>
		</Fragment>
	);
}

export function StaticSVG({ options }) {
	let styles = "";
	if (typeof options.strokeColor !== "undefined") {
		styles += `stroke: ${options.strokeColor}; `;
	}
	if (typeof options.strokeWidth !== "undefined") {
		styles += `stroke-width: ${options.strokeWidth}; `;
	}

	return (
		<div class="check-content svg">
			<svg class="feather" style={styles}>
				<use xlinkHref={`/dist/feather-sprite.svg#${options.svg}`} />
			</svg>
		</div>
	);
}

export const StaticSVGDefaults = {
	svg: "cloud",
	strokeColor: "#00b6ff",
	strokeWidth: "1",
};
