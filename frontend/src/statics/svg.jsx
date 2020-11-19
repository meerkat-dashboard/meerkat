import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { svgList } from '../svg-list';

export function StaticSVGOptions({options, updateOptions}) {
	const svgOptions = svgList.map(svgName => <option value={svgName}>{svgName}</option>)

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	return <Fragment>
		<label for="svg">SVG</label>
		<select class="form-control" id="svg" name="svg" value={options.svg}
				onInput={e => updateOptions({svg: e.currentTarget.value})}>
			{svgOptions}
		</select>

		<label for="stroke-color">Stroke color <a onClick={e => clearField(e, 'strokeColor')}>clear</a></label>
		<div class="left spacer">
			<input class="form-control" type="color" name="stroke-color" id="stroke-color" value={options.strokeColor}
				onInput={e => updateOptions({strokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.strokeColor} disabled />
		</div>

		<label for="stroke-width">Stroke width</label>
		<input class="form-control" id="stroke-width" name="stroke-width" type="number" min="0" step="any" value={options.strokeWidth}
			onInput={e => updateOptions({strokeWidth: e.currentTarget.value})}/>
	</Fragment>
}

export function StaticSVG({options}) {
	let styles = '';
	if(typeof options.strokeColor !== 'undefined') {
		styles += `stroke: ${options.strokeColor}; `;
	}
	if(typeof options.strokeWidth !== 'undefined') {
		styles += `stroke-width: ${options.strokeWidth}; `;
	}

	return <div class="check-content svg">
		<svg class="feather" style={styles}>
			<use xlinkHref={`/res/svgs/feather-sprite.svg#${options.svg}`}/>
		</svg>
	</div>
}

export const StaticSVGDefaults = {
	svg: 'cloud',
	strokeColor: '#00b6ff',
	strokeWidth: '1'
}