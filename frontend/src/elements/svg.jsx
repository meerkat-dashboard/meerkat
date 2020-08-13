import { h, Fragment, options } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId } from '../util'

import { svgList } from '../svg-list'

export function CheckSVGOptions({options, updateOptions}) {
	const svgOptions = svgList.map(svgName => <option value={svgName}>{svgName}</option>)

	return <div class="card-options">
		<label for="okSvg">OK SVG</label>
		<select id="okSvg" name="okSvg" value={options.okSvg}
				onInput={e => updateOptions({okSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="ok-stroke-color">OK Stroke color</label>
		<div class="left spacer">
			<input type="color" name="ok-stroke-color" id="ok-stroke-color" value={options.okStrokeColor}
				onInput={e => updateOptions({okStrokeColor: e.currentTarget.value})}/>
			<input type="text" value={options.okStrokeColor} disabled />
		</div>
		<hr />

		<label for="warningSvg">Warning SVG</label>
		<select id="warningSvg" name="warningSvg" value={options.warningSvg}
				onInput={e => updateOptions({warningSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="warning-stroke-color">Warning Stroke color</label>
		<div class="left spacer">
			<input type="color" name="warning-stroke-color" id="warning-stroke-color" value={options.warningStrokeColor}
				onInput={e => updateOptions({warningStrokeColor: e.currentTarget.value})}/>
			<input type="text" value={options.warningStrokeColor} disabled />
		</div>
		<hr />

		<label for="unknownSvg">Unknown SVG</label>
		<select id="unknownSvg" name="unknownSvg" value={options.unknownSvg}
				onInput={e => updateOptions({unknownSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="unknown-stroke-color">Unknown Stroke color</label>
		<div class="left spacer">
			<input type="color" name="unknown-stroke-color" id="unknown-stroke-color" value={options.unknownStrokeColor}
				onInput={e => updateOptions({unknownStrokeColor: e.currentTarget.value})}/>
			<input type="text" value={options.unknownStrokeColor} disabled />
		</div>
		<hr />

		<label for="criticalSvg">Critical SVG</label>
		<select id="criticalSvg" name="criticalSvg" value={options.criticalSvg}
				onInput={e => updateOptions({criticalSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="critical-stroke-color">Critical Stroke color</label>
		<div class="left spacer">
			<input type="color" name="critical-stroke-color" id="critical-stroke-color" value={options.criticalStrokeColor}
				onInput={e => updateOptions({criticalStrokeColor: e.currentTarget.value})}/>
			<input type="text" value={options.criticalStrokeColor} disabled />
		</div>
	</div>
}

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckSVG({check}) {
	const [checkState, setCheckState] = useState(null);

	//Handle state update
	const updateState = async () => {
		const checkType = icingaCheckTypeFromId(check.checkID);
		const res = await meerkat.getIcingaCheckState(check.checkID, checkType);
		const state = icingaResultCodeToCheckState(checkType, res.state);
		setCheckState(state);
	}

	//Setup check refresher
	useEffect(() => {
		if(check.checkID !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [check.checkID]);

	//SVG stroke color and icons to the correct version based 
	//on the current check state
	let styles = '';
	let svgName = '';
	if(checkState === 'ok' || checkState === 'up') {
		styles = check.options.okStrokeColor ? `stroke: ${check.options.okStrokeColor}` : '';
		svgName = check.options.okSvg;
	}
	if(checkState === 'warning') {
		styles = check.options.warningStrokeColor ? `stroke: ${check.options.warningStrokeColor}` : '';
		svgName = check.options.warningSvg;
	}
	if(checkState === 'unknown') {
		styles = check.options.unknownStrokeColor ? `stroke: ${check.options.unknownStrokeColor}` : '';
		svgName = check.options.unknownSvg;
	}
	if(checkState === 'critical' || checkState === 'down') {
		styles = check.options.criticalStrokeColor ? `stroke: ${check.options.criticalStrokeColor}` : '';
		svgName = check.options.criticalSvg;
	}

	return <div class="check-content svg">
		<svg class="feather" style={styles}>
			<use xlinkHref={`/res/svgs/feather-sprite.svg#${svgName}`}/>
		</svg>
	</div>
}