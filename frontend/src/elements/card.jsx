import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

//The rendered view (in the actual dashboard) of the Card Element
export function CheckCard({options}) {
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

	return <div class={"check-content card " + checkState}>
		<div class="check-state" style={`font-size: ${options.statusFontSize}px`}>
			{checkState === null ? 'Unconfigured' : checkState}
		</div>
	</div>
}

//Card options, displayed in the sidebar
export function CheckCardOptions({options, updateOptions}) {
	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList checkId={options.checkId}
			updateCheckId={checkId => updateOptions({checkId: checkId})} />

		<label for="status-font-size">Status Font Size</label>
		<input class="form-control" id="status-font-size" name="status-font-size" type="number" min="0"
			value={options.statusFontSize}
			onInput={e => updateOptions({statusFontSize: e.currentTarget.value})}/>
	</div>
}