import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList, alertSounds } from '../util'

export function CheckImageOptions({options, updateOptions}) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () => showAdvanced ? setAdvanced(false) : setAdvanced(true);

	const handleImageUpload = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {}
		opts[fieldName] = res.url
		updateOptions(opts);
	}

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	const imgControls = (field) => {
		if(options[field]) {
			return <Fragment>
				<a onClick={e => clearField(e, field)}>clear</a>&nbsp;
				<a target="_blank" href={options[field]}>view</a>
			</Fragment>
		}
		return null;
	}

	return <Fragment>
		<label>Icinga Host or Service</label>
		<IcingaCheckList currentCheckopts={options}
			updateOptions={updateOptions} />
		<br/>
		<label for="image-linking-url">Linking Url</label>
		<input class="form-control" id="image-linking-url" name="image-linking-url" type="text" value={options.linkURL}
			   onInput={e => updateOptions({linkURL: e.currentTarget.value})}>
		</input>
		<hr/>

		<label for="ok-image">OK State Image {imgControls('okImage')}</label>
		<input class="form-control" id="ok-image" name="ok-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('okImage', e.target.files)}/>

		<label for="warning-image">Warning State Image {imgControls('warningImage')}</label>
		<input class="form-control" id="warning-image" name="warning-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('warningImage', e.target.files)}/>

		<label for="warning-image">Warning Acknowledged State Image {imgControls('warningAcknowledgedImage')}</label>
		<input class="form-control" id="warning-image" name="warning-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('warningAcknowledgedImage', e.target.files)}/>

		<label for="unknown-image">Unknown State Image {imgControls('unknownImage')}</label>
		<input class="form-control" id="unknown-image" name="unknown-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('unknownImage', e.target.files)}/>

		<label for="unknown-image">Unknown Acknowledged State Image {imgControls('unknownAcknowledgedImage')}</label>
		<input class="form-control" id="unknown-image" name="unknown-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('unknownAcknowledgedImage', e.target.files)}/>

		<label for="critical-image">Critical State Image {imgControls('criticalImage')}</label>
		<input class="form-control" id="critical-image" name="critical-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('criticalImage', e.target.files)}/>

		<label for="critical-image">Critical Acknowledged State Image {imgControls('criticalAcknowledgedImage')}</label>
		<input class="form-control" id="critical-image" name="critical-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('criticalAcknowledgedImage', e.target.files)}/>
		<br/>
		<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>{showAdvanced ? 'Hide Options' : 'Advanced Options'}</button>
		<AdvancedImageOptions options={options} updateOptions={updateOptions} display={showAdvanced}/>
	</Fragment>
}

const AdvancedImageOptions = ({options, updateOptions, display}) => {
	const handleAudioFile = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {}
		opts[fieldName] = res.url
		updateOptions(opts);
	}

	const muteAlerts = (e) => {
		let volumeChecked = options.muteAlerts;
		volumeChecked = !volumeChecked;
		updateOptions({
			muteAlerts: volumeChecked
		})
	}

	const audioControls = (src) => {
		if(src) {
			return <Fragment>
				<a target="_blank" href={src}>view</a>
			</Fragment>
		}
		return null;
	}

	return <div style={{display: display ? '' : 'none'}}>
		<br/>
		<label class="status-font-size">Mute Card Alerts</label>
    	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/></span>
		<br/><br/>
		<label for="soundFile">Ok Alert Sound {audioControls(options.okSound)} <a onClick={e => updateOptions({okSound: ""})}>default</a></label>
		<input type="file" id="okSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('okSound', e.target.files)}>
		</input>
		<label for="soundFile">Warning Alert Sound {audioControls(options.warningSound)} <a onClick={e => updateOptions({warningSound: ""})}>default</a></label>
		<input type="file" id="warningSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('warningSound', e.target.files)}>
		</input>
		<label for="soundFile">Critical Alert Sound {audioControls(options.criticalSound)} <a onClick={e => updateOptions({criticalSound: ""})}>default</a></label>
		<input type="file" id="criticalSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('criticalSound', e.target.files)}>
		</input>
		<label for="soundFile">Unknown Alert Sound {audioControls(options.unknownSound)} <a onClick={e => updateOptions({unknownSound: ""})}>default</a></label>
		<input type="file" id="unknownSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('unknownSound', e.target.files)}>
		</input>
		<label for="soundFile">Up Alert Sound {audioControls(options.upSound)} <a onClick={e => updateOptions({upSound: ""})}>default</a></label>
		<input type="file" id="upSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('upSound', e.target.files)}>
		</input>
		<label for="soundFile">Down Alert Sound {audioControls(options.downSound)} <a onClick={e => updateOptions({okSound: ""})}>default</a></label>
		<input type="file" id="downSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('downSound', e.target.files)}>
		</input>
	</div>
}

export function CheckImage({options, dashboard}) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	const updateState = async () => {
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
				if (res === false) window.flash(`This dashboard isn't updating`, 'error');
				res.Acknowledged ? setAcknowledged('ack') : setAcknowledged("");
				setCheckState(icingaResultCodeToCheckState(options.objectType, res.MaxState));
			} catch (error) {
				window.flash("This dashboard isn't updating", 'error')
			}
		}
	}

	useEffect(() => {
		if(options.objectType !== null && options.filter !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	alertSounds(checkState, options, dashboard);

	let source = null;
	if(checkState === 'ok' || checkState === 'up') {source = options.okImage}
	if(checkState === 'warning') {source = acknowledged ? options.warningAcknowledgedImage : options.warningImage}
	if(checkState === 'unknown') {source = acknowledged ? options.unknownAcknowledgedImage : options.unknownImage}
	if(checkState === 'critical' || checkState === 'down') {source = acknowledged ? options.criticalAcknowledgedImage : options.criticalImage}

	return <div class="check-content image">
		<img src={source} />
	</div>
}
