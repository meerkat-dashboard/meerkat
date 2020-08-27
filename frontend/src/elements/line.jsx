import { h, Fragment, options } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

export function CheckLineOptions({options, updateOptions}) {
	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList checkId={options.checkId}
			updateCheckId={checkId => updateOptions({checkId: checkId})} />

		<label for="stroke-width">Stroke width</label>
		<input id="stroke-width" name="stroke-width" type="number" min="0" step="any" value={options.strokeWidth}
			onInput={e => updateOptions({strokeWidth: Number(e.currentTarget.value)})}/>


		<label>Render Arrows</label>
		<div class="left spacer">
			<input id="left-arrow" type="checkbox" checked={options.leftArrow}
				onClick={e => updateOptions({leftArrow: e.currentTarget.checked})}/>
			<label for="left-arrow" class="no-margin" style="font-weight: normal">Left</label>
		</div>
		<div class="left spacer">
			<input id="right-arrow" type="checkbox" checked={options.rightArrow}
				onClick={e => updateOptions({rightArrow: e.currentTarget.checked})}/>
			<label for="right-arrow" class="no-margin" style="font-weight: normal">Right</label>
		</div>
	</div>
}

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckLine({options}) {
	const svgRef = useRef({clientWidth: 100, clientHeight: 40});
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
	let strokeColor = '';
	if(checkState === 'ok' || checkState === 'up') {
		strokeColor = `var(--color-icinga-green)`
	}
	if(checkState === 'warning') {
		strokeColor = `var(--color-icinga-yellow)`
	}
	if(checkState === 'unknown') {
		strokeColor = `var(--color-icinga-purple)`
	}
	if(checkState === 'critical' || checkState === 'down') {
		strokeColor = `var(--color-icinga-red)`
	}

	return <div class="check-content svg" ref={svgRef}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${svgRef.current.clientWidth} ${svgRef.current.clientHeight}`} fill="none"
			stroke={strokeColor} stroke-width={options.strokeWidth} stroke-linecap="round" stroke-linejoin="round">
			<line x1="5" y1={svgRef.current.clientHeight / 2} x2={svgRef.current.clientWidth - 5} y2={svgRef.current.clientHeight / 2}></line>
			{ options.leftArrow ? <polyline points={`30 5 5 ${svgRef.current.clientHeight / 2} 30 ${svgRef.current.clientHeight - 5}`}></polyline> : null }
			{ options.rightArrow ? <polyline points={`${svgRef.current.clientWidth - 30} 5 ${svgRef.current.clientWidth - 5} ${svgRef.current.clientHeight / 2} ${svgRef.current.clientWidth - 30} ${svgRef.current.clientHeight - 5}`}></polyline> : null }
		</svg>
	</div>
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true
}