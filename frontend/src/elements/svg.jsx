import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId } from '../util'

export function CheckSVGOptions({options, updateOptions}) {
	return <div>todo</div>
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

	// let source = null;
	// if(checkState === 'ok' || checkState === 'up') {source = check.options.okImage}
	// if(checkState === 'warning') {source = check.options.warningImage}
	// if(checkState === 'unknown') {source = check.options.unknownImage}
	// if(checkState === 'critical' || checkState === 'down') {source = check.options.criticalImage}

	return <div class="check-content svg">TODO</div>
}