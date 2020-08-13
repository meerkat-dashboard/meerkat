import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId } from '../util'

export function CheckImageOptions({options, updateOptions}) {
	const handleImageUpload = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {}
		opts[fieldName] = res.url
		updateOptions(opts);
	}

	return <Fragment>
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
export function CheckImage({check}) {
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

	let source = null;
	if(checkState === 'ok' || checkState === 'up') {source = check.options.okImage}
	if(checkState === 'warning') {source = check.options.warningImage}
	if(checkState === 'unknown') {source = check.options.unknownImage}
	if(checkState === 'critical' || checkState === 'down') {source = check.options.criticalImage}

	return <div class="check-content image">
		<img src={source} />
	</div>
}