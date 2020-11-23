import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

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

		<label for="unknown-image">Unknown State Image {imgControls('unknownImage')}</label>
		<input class="form-control" id="unknown-image" name="unknown-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('unknownImage', e.target.files)}/>
				
		<label for="critical-image">Critical State Image {imgControls('criticalImage')}</label>
		<input class="form-control" id="critical-image" name="critical-image" type="file"
			accept="image/*" onInput={e => handleImageUpload('criticalImage', e.target.files)}/>
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
		console.log(opts);
		updateOptions(opts);
	}

	const clearAudioFile = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	const muteAlerts = (e) => {
		let volumeChecked = options.muteAlerts;
		volumeChecked = !volumeChecked;
		updateOptions({
			muteAlerts: volumeChecked
		})
	}

	const audioControls = src => {
		if(src) {
			return <Fragment>
				<a onClick={e => clearAudioFile(e, field)}>clear</a>&nbsp;
				<a target="_blank" href={src}>view</a>
			</Fragment>
		}
		return null;
	}

	return <div style={{display: display ? '' : 'none'}}>
		<br/>
		<label class="status-font-size">Mute Image Alerts</label>
    	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/></span><br/><br/>
		<label for="soundFile">Ok Alert Sound {audioControls(options.okSound)}</label>
		<input type="file" id="okSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={e => handleAudioFile('okSound', e.target.files)}>
		</input>
		<label for="soundFile">Warning Alert Sound {audioControls(options.warningSound)}</label>
		<input type="file" id="warningSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={e => handleAudioFile('warningSound', e.target.files)}>
		</input>
		<label for="soundFile">Critical Alert Sound {audioControls(options.criticalSound)}</label>
		<input type="file" id="criticalSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={e => handleAudioFile('criticalSound', e.target.files)}>
		</input>
		<label for="soundFile">Unknown Alert Sound {audioControls(options.unknownSound)}</label>
		<input type="file" id="unknownSound" accept="audio/*" 
			   placeholder="Upload an audio file" 
			   onInput={e => handleAudioFile('unknownSound', e.target.files)}>
		</input>
	</div>
}
  

//The rendered view (in the actual dashboard) of the Check Image
export function CheckImage({options, dashboard, slug}) {
	const [checkState, setCheckState] = useState(null);

	let ok = false;
	let warning = false;
	let critical = false;
	let unknown = false;
	let dash = {};

	const initState = async () => {
		const res = await meerkat.getIcingaObjectState(options.objectType, options.filter);
		const state = icingaResultCodeToCheckState(options.objectType, res);
		if (state === 'ok') ok = true;
		if (state === 'up') ok = true;
		if (state === 'down') warning = true;
		if (state === 'warning') warning = true;
		if (state === 'critical') critical = true;
		if (state === 'unknown') unknown = true;
	}

	//Handle state update
	const updateState = async () => {
		meerkat.getDashboard(slug).then(async d => {
			dash = await d

			const o = options.okSound       ? new Audio(options.okSound)       : new Audio(dash.okSound);
			const w = options.warningSound  ? new Audio(options.warningSound)  : new Audio(dash.warningSound);
			const c = options.criticalSound ? new Audio(options.criticalSound) : new Audio(dash.criticalSound);
			const u = options.unknownSound  ? new Audio(options.unknownSound)  : new Audio(dash.unknownSound);

			//get globalMute from dashboard JSON
			const muteAlerts = () => {
				meerkat.getDashboard(slug).then(async d => {
					if (options.muteAlerts || d.globalMute) {
						o.volume = 0.0; w.volume = 0.0; c.volume = 0.0; u.volume = 0.0;
					} else {
						o.volume = 1.0; w.volume = 1.0; c.volume = 1.0; u.volume = 1.0;
					}
				});
			}

			const alertSound = (state) => {
				if (options.objectType !== null) {
					const resetState = (o, w, c ,u) => {
						if (o) ok = false;
						if (w) warning = false; 
						if (c) critical = false;
						if (u) unknown = false; 
					}
					
					if(options.objectType === 'service') {
						switch(state){
							case 'ok':       if (!ok)       {o.play(); ok = true;       resetState(0,1,1,1)} break;
							case 'warning':  if (!warning)  {w.play(); warning = true;  resetState(1,0,1,1)} break;   
							case 'critical': if (!critical) {c.play(); critical = true; resetState(1,1,0,1)} break;
							case 'unknown':  if (!unknown)  {u.play(); unknown = true;  resetState(1,1,1,0)} break;
						}	
					} else if(options.objectType === 'host') {
						console.log(state);
						switch(state){
							case 'up':   if (!ok)      { o.play(); ok = true;      resetState(0,1,1,1)} break;
							case 'down': if (!warning) { w.play(); warning = true; resetState(1,0,1,1)} break;
						}
					}
				}
			}
			if (options.objectType !== null && options.filter !== null) {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter);
				const state = icingaResultCodeToCheckState(options.objectType, res);
				setCheckState(state);
				muteAlerts();
				alertSound(state);
			}
		});
	}

	//Setup check refresher
	useEffect(() => {
		if(options.objectType !== null && options.filter !== null) {
			initState();
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	let source = null;
	if(checkState === 'ok' || checkState === 'up') {source = options.okImage}
	if(checkState === 'warning') {source = options.warningImage}
	if(checkState === 'unknown') {source = options.unknownImage}
	if(checkState === 'critical' || checkState === 'down') {source = options.criticalImage}

	return <div class="check-content image">
		<img src={source} />
	</div>
}
