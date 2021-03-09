import { h, Fragment, options } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

import { svgList } from '../svg-list'
import { DashboardView } from '../editor';

export function CheckSVGOptions({options, updateOptions}) {
	const svgOptions = svgList.map(svgName => <option value={svgName}>{svgName}</option>)
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () => showAdvanced ? setAdvanced(false) : setAdvanced(true);

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList currentCheckopts={options}
			updateOptions={updateOptions} />
		<br/>
		<label for="image-linking-url">Linking Url</label>
		<input class="form-control" id="image-linking-url" name="image-linking-url" type="text" value={options.linkURL}
			onInput={e => updateOptions({linkURL: e.currentTarget.value})}>
  		</input>

		<label for="okSvg">OK SVG</label>
		<select class="form-control" id="okSvg" name="okSvg" value={options.okSvg}
				onInput={e => updateOptions({okSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="ok-stroke-color">OK Stroke color <a onClick={e => clearField(e, 'okStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="ok-stroke-color" id="ok-stroke-color" value={options.okStrokeColor}
				onInput={e => updateOptions({okStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.okStrokeColor} disabled />
		</div>
		<hr />

		<label for="warningSvg">Warning SVG</label>
		<select class="form-control" id="warningSvg" name="warningSvg" value={options.warningSvg}
				onInput={e => updateOptions({warningSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="warning-stroke-color">Warning Stroke color <a onClick={e => clearField(e, 'warningStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="warning-stroke-color" id="warning-stroke-color" value={options.warningStrokeColor}
				onInput={e => updateOptions({warningStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.warningStrokeColor} disabled />
		</div>
		<label for="warning-stroke-color">Warning Acknowledged Stroke color <a onClick={e => clearField(e, 'warningStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="warning-stroke-color" id="warning-stroke-color" value={options.warningAcknowledgedStrokeColor}
				onInput={e => updateOptions({warningAcknowledgedStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.warningAcknowledgedStrokeColor} disabled />
		</div>
		<hr />

		<label for="unknownSvg">Unknown SVG</label>
		<select class="form-control" id="unknownSvg" name="unknownSvg" value={options.unknownSvg}
				onInput={e => updateOptions({unknownSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="unknown-stroke-color">Unknown Stroke color <a onClick={e => clearField(e, 'unknownStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="unknown-stroke-color" id="unknown-stroke-color" value={options.unknownStrokeColor}
				onInput={e => updateOptions({unknownStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.unknownStrokeColor} disabled />
		</div>
		<label for="unknown-stroke-color">Unknown Acknowledged Stroke color <a onClick={e => clearField(e, 'unknownStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="unknown-stroke-color" id="unknown-stroke-color" value={options.unknownAcknowledgedStrokeColor}
				onInput={e => updateOptions({unknownAcknowledgedStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.unknownAcknowledgedStrokeColor} disabled />
		</div>
		<hr />

		<label for="criticalSvg">Critical SVG</label>
		<select class="form-control" id="criticalSvg" name="criticalSvg" value={options.criticalSvg}
				onInput={e => updateOptions({criticalSvg: e.currentTarget.value})}>
			{svgOptions}
		</select>
		<label for="critical-stroke-color">Critical Stroke color <a onClick={e => clearField(e, 'criticalStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="critical-stroke-color" id="critical-stroke-color" value={options.criticalStrokeColor}
				onInput={e => updateOptions({criticalStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.criticalStrokeColor} disabled />
		</div>
		<label for="critical-stroke-color">Critical Acknowledged Stroke color <a onClick={e => clearField(e, 'criticalStrokeColor')}>clear</a></label>
		<div class="left spacer">
			<input type="color" name="critical-stroke-color" id="critical-stroke-color" value={options.criticalAcknowledgedStrokeColor}
				onInput={e => updateOptions({criticalAcknowledgedStrokeColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.criticalAcknowledgedStrokeColor} disabled />
		</div>
		<br/>
		<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>{showAdvanced ? 'Hide Options' : 'Advanced Options'}</button>
		<AdvancedSVGOptions options={options} updateOptions={updateOptions} display={showAdvanced}/>
	</div>
}

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckSVG({options, dashboard, slug}) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	let ok = false;
	let warning = false;
	let critical = false;
	let unknown = false;
	let upp = false;
	let down = false;
	let dash = {};

	const initState = async () => {
		const res = await meerkat.getIcingaObjectState(options.objectType, options.filter);
		const state = icingaResultCodeToCheckState(options.objectType, res.MaxState);
		res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
		if (state === 'ok') ok = true;
		if (state === 'up') upp = true;
		if (state === 'down') warning = true;
		if (state === 'warning') warning = true;
		if (state === 'critical') critical = true;
		if (state === 'unknown') unknown = true;
	}

	//Handle state update
	const updateState = async () => {
		meerkat.getDashboard(slug).then(async d => {
			dash = await d

			const o   = options.okSound       ? new Audio(options.okSound)       : new Audio(dash.okSound);
			const w   = options.warningSound  ? new Audio(options.warningSound)  : new Audio(dash.warningSound);
			const c   = options.criticalSound ? new Audio(options.criticalSound) : new Audio(dash.criticalSound);
			const u   = options.unknownSound  ? new Audio(options.unknownSound)  : new Audio(dash.unknownSound);
			const up  = options.upSound       ? new Audio(options.upSound)       : new Audio(dash.upSound);
			const dow = options.downSound     ? new Audio(options.downSound)     : new Audio(dash.downSound);

			//get globalMute from dashboard JSON
			const muteAlerts = () => {
				meerkat.getDashboard(slug).then(async d => {
					if (options.muteAlerts || d.globalMute) {
						o.volume = 0.0; w.volume = 0.0; c.volume = 0.0; u.volume = 0.0; up.volume = 0.0; dow.volume = 0.0;
					} else {
						o.volume = 1.0; w.volume = 1.0; c.volume = 1.0; u.volume = 1.0; up.volume = 1.0; dow.volume = 1.0;
					}
				});
			}

			const alertSound = (state) => {
				if (options.objectType !== null) {
					const resetState = (o, w, c, u, up, d) => {
						if (o) ok = false;
						if (w) warning = false;
						if (c) critical = false;
						if (u) unknown = false;
						if (up) up = false;
						if (d)  down = false;
					}

					if(options.objectType === 'service') {
						switch(state){
							case 'ok':       if (!ok)       {o.play(); ok = true;       resetState(0,1,1,1,1,1)} break;
							case 'warning':  if (!warning)  {w.play(); warning = true;  resetState(1,0,1,1,1,1)} break;
							case 'critical': if (!critical) {c.play(); critical = true; resetState(1,1,0,1,1,1)} break;
							case 'unknown':  if (!unknown)  {u.play(); unknown = true;  resetState(1,1,1,0,1,1)} break;
						}
					} else if(options.objectType === 'host') {
						console.log(state);
						switch(state){
							case 'up':   if (!upp)  { o.play(); upp = true;  resetState(1,1,1,1,0,1)} break;
							case 'down': if (!down) { w.play(); down = true; resetState(1,1,1,1,1,0)} break;
						}
					}
				}
			}
			if (options.objectType !== null && options.filter !== null) {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter);
				const state = icingaResultCodeToCheckState(options.objectType, res.MaxState);
				res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
				setCheckState(state);
				muteAlerts();
				alertSound(state);
			}
		});
	}

	//Setup check refresher
	useEffect(() => {
		if(options.objectType !== null && options.filter != null) {
			initState();
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	//SVG stroke color and icons to the correct version based
	//on the current check state
	let styles = '';
	let svgName = '';
	if(checkState === 'ok' || checkState === 'up') {
		styles = options.okStrokeColor ? `stroke: ${options.okStrokeColor}` : '';
		svgName = options.okSvg;
	}
	if(checkState === 'warning') {
		let warningStroke = acknowledged !== "" ? options.warningAcknowledgedStrokeColor : options.warningStrokeColor;
		styles = options.warningStrokeColor ? `stroke: ${warningStroke}` : '';
		svgName = options.warningSvg;
	}
	if(checkState === 'unknown') {
		let unknownStroke = acknowledged !== "" ? options.unknownAcknowledgedStrokeColor : options.unknownStrokeColor;
		styles = options.unknownStrokeColor ? `stroke: ${unknownStroke}` : '';
		svgName = options.unknownSvg;
	}
	if(checkState === 'critical' || checkState === 'down') {
		let criticalStroke = acknowledged !== "" ? options.criticalAcknowledgedStrokeColor : options.criticalStrokeColor;
		styles = options.criticalStrokeColor ? `stroke: ${criticalStroke}` : '';
		svgName = options.criticalSvg;
	}

	return <div class="check-content svg">
		<svg class="feather" style={styles}>
			<use xlinkHref={`/res/svgs/feather-sprite.svg#${svgName}`}/>
		</svg>
	</div>
}

const AdvancedSVGOptions = ({options, updateOptions, display}) => {
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
				<a target="_blank" href={src}>view</a>&nbsp;
			</Fragment>
		}
		return null;
	}

	const resetOk = () => {
		updateOptions({okSound: ""});
	}

	const resetCritical = () => {
		updateOptions({resetSound: ""});
	}

	const resetWarning = () => {
		updateOptions({warningSound: ""});
	}

	const resetUnknown = () => {
		updateOptions({unknownSound: ""});
	}

	const resetUp = () => {
		updateOptions({upSound: ""});
	}

	const resetDown = () => {
		updateOptions({downSound: ""});
	}

	return <div style={{display: display ? '' : 'none'}}>
	<br/>
	<label class="status-font-size">Mute Card Alerts</label>
	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/></span><br/><br/>
	<label for="soundFile">Ok Alert Sound {audioControls(options.okSound)} <a onClick={resetOk}>default</a></label>
	<input type="file" id="okSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('okSound', e.target.files)}>
	</input>
	<label for="soundFile">Warning Alert Sound {audioControls(options.warningSound)} <a onClick={resetCritical}>default</a></label>
	<input type="file" id="warningSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('warningSound', e.target.files)}>
	</input>
	<label for="soundFile">Critical Alert Sound {audioControls(options.criticalSound)} <a onClick={resetWarning}>default</a></label>
	<input type="file" id="criticalSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('criticalSound', e.target.files)}>
	</input>
	<label for="soundFile">Unknown Alert Sound {audioControls(options.unknownSound)} <a onClick={resetUnknown}>default</a></label>
	<input type="file" id="unknownSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('unknownSound', e.target.files)}>
	</input>
	<label for="soundFile">Up Alert Sound {audioControls(options.upSound)} <a onClick={resetUp}>default</a></label>
	<input type="file" id="upSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('upSound', e.target.files)}>
	</input>
	<label for="soundFile">Down Alert Sound {audioControls(options.downSound)} <a onClick={resetDown}>default</a></label>
	<input type="file" id="downSound" accept="audio/*"
		   placeholder="Upload an audio file"
		   onInput={e => handleAudioFile('downSound', e.target.files)}>
	</input>
</div>
}

export const CheckSVGDefaults = {
	okSvg: 'check-circle',
	okStrokeColor: '#0ee16a',
	warningSvg: 'alert-triangle',
	warningStrokeColor: '#ff9000',
	warningAcknowledgedStrokeColor: '#ffca39',
	unknownSvg: 'help-circle',
	unknownStrokeColor: '#970ee1',
	unknownAcknowledgedStrokeColor: '#b594b5',
	criticalSvg: 'alert-octagon',
	criticalStrokeColor: '#ff0019',
	criticalAcknowledgedStrokeColor: '#de5e84',
	muteAlerts: false,
}
