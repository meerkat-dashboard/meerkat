import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

export function CheckImageOptions({options, updateOptions}) {
	const handleImageUpload = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {}
		opts[fieldName] = res.url
		updateOptions(opts);
	}

	return <Fragment>
		<label>Icinga Host or Service</label>
		<IcingaCheckList checkId={options.checkId}
			updateCheckId={checkId => updateOptions({checkId: checkId})} />

		<label for="ok-image">OK State Image</label>
		<input id="ok-image" name="ok-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('okImage', e.target.files)}/>

		<label for="warning-image">Warning State Image</label>
		<input id="warning-image" name="warning-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('warningImage', e.target.files)}/>

		<label for="unknown-image">Unknown State Image</label>
		<input id="unknown-image" name="unknown-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('unknownImage', e.target.files)}/>

		<label for="critical-image">Critical State Image</label>
		<input id="critical-image" name="critical-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('criticalImage', e.target.files)}/>
	</Fragment>
}

//The rendered view (in the actual dashboard) of the Check Image
export function CheckImage({options}) {
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

	let source = null;
	if(checkState === 'ok' || checkState === 'up') {source = options.okImage}
	if(checkState === 'warning') {source = options.warningImage}
	if(checkState === 'unknown') {source = options.unknownImage}
	if(checkState === 'critical' || checkState === 'down') {source = options.criticalImage}

	return <div class="check-content image">
		<img src={source} />
	</div>
}