import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId } from '../util'

//The rendered view (in the actual dashboard) of the Card Element
export function CheckCard({check}) {
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

	return <div class={"check-content card " + checkState}>
		<p style={`font-size: ${check.options.nameFontSize}px`}>{check.title}</p>
		<div class="check-state" style={`font-size: ${check.options.statusFontSize}px`}>
			{checkState === null ? 'Unconfigured' : checkState}
		</div>
	</div>
}

//Card options, displayed in the sidebar
export function CheckCardOptions({check, updateOptions}) {
	return <div class="card-options">
		<label for="name-font-size">Name Font Size</label>
		<input id="name-font-size" name="name-font-size" type="number" min="0"
			value={check.options.nameFontSize}
			onInput={e => updateOptions({nameFontSize: e.currentTarget.value})}/>
			
		<label for="status-font-size">Status Font Size</label>
		<input id="status-font-size" name="status-font-size" type="number" min="0"
			value={check.options.statusFontSize}
			onInput={e => updateOptions({statusFontSize: e.currentTarget.value})}/>
	</div>
}