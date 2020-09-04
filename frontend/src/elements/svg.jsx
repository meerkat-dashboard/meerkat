import { h, Fragment, options } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

import { svgList } from '../svg-list'

export function CheckSVGOptions({options, updateOptions}) {
	const svgOptions = svgList.map(svgName => <option value={svgName}>{svgName}</option>)

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList checkId={options.checkId}
			updateCheckId={checkId => updateOptions({checkId: checkId})} />

		<label for="okSvg">OK SVG</label>
		<select id="okSvg" name="okSvg" value={options.okSvg}
				onInput={e => updateOptions({okSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="ok-stroke-color">OK Stroke color <a onClick={e => clearField(e, 'okStrokeColor')}>clear</a></label>
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
		<label for="warning-stroke-color">Warning Stroke color <a onClick={e => clearField(e, 'warningStrokeColor')}>clear</a></label>
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
		<label for="unknown-stroke-color">Unknown Stroke color <a onClick={e => clearField(e, 'unknownStrokeColor')}>clear</a></label>
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
		<label for="critical-stroke-color">Critical Stroke color <a onClick={e => clearField(e, 'criticalStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="critical-stroke-color" id="critical-stroke-color" value={options.criticalStrokeColor}
				onInput={e => updateOptions({criticalStrokeColor: e.currentTarget.value})}/>
			<input type="text" value={options.criticalStrokeColor} disabled />
		</div>
	</div>
}

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckSVG({options}) {
	const [checkState, setCheckState] = useState(null);

	//Handle state update
	const updateState = async () => {
		const checkType = icingaCheckTypeFromId(options.checkId);
		const res = await meerkat.getIcingaCheckState(options.checkId, checkType);
		const state = icingaResultCodeToCheckState(checkType, res.state);
		setCheckState(state);
	}

	//Setup check refresher
	useEffect(() => {
		if(options.checkId !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.checkId]);

	//SVG stroke color and icons to the correct version based 
	//on the current check state
	let styles = '';
	let svgName = '';
	if(checkState === 'ok' || checkState === 'up') {
		styles = options.okStrokeColor ? `stroke: ${options.okStrokeColor}` : '';
		svgName = options.okSvg;
	}
	if(checkState === 'warning') {
		styles = options.warningStrokeColor ? `stroke: ${options.warningStrokeColor}` : '';
		svgName = options.warningSvg;
	}
	if(checkState === 'unknown') {
		styles = options.unknownStrokeColor ? `stroke: ${options.unknownStrokeColor}` : '';
		svgName = options.unknownSvg;
	}
	if(checkState === 'critical' || checkState === 'down') {
		styles = options.criticalStrokeColor ? `stroke: ${options.criticalStrokeColor}` : '';
		svgName = options.criticalSvg;
	}

	return <div class="check-content svg">
		<svg class="feather" style={styles}>
			<use xlinkHref={`/res/svgs/feather-sprite.svg#${svgName}`}/>
		</svg>
	</div>
}

export const CheckSVGDefaults = {
	okSvg: 'check-circle',
	okStrokeColor: '#44bb77',
	warningSvg: 'alert-triangle',
	warningStrokeColor: '#aa44ff',
	unknownSvg: 'help-circle',
	unknownStrokeColor: '#ffaa44',
	criticalSvg: 'alert-octagon',
	criticalStrokeColor: '#ff5566',
}