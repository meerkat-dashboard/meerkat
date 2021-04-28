import { h, Fragment, options } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

export function CheckLineOptions({options, updateOptions}) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () => showAdvanced ? setAdvanced(false) : setAdvanced(true);

	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList currentCheckopts={options}
			updateOptions={updateOptions} />

		<br/>
		<label for="line-linking-url">Linking Url</label>
		<input class="form-control" id="line-linking-url" name="line-linking-url" type="text" value={options.linkURL}
			onInput={e => updateOptions({linkURL: e.currentTarget.value})}>
  		</input>

		<label for="stroke-width">Stroke width</label>
		<input class="form-control" id="stroke-width" name="stroke-width" type="number" min="0" step="any" value={options.strokeWidth}
			onInput={e => updateOptions({strokeWidth: Number(e.currentTarget.value)})}/>


		<label>Render Arrows</label>
		<div class="left spacer">
			<input class="form-control" id="left-arrow" type="checkbox" checked={options.leftArrow}
				onClick={e => updateOptions({leftArrow: e.currentTarget.checked})}/>
			<label for="left-arrow" class="no-margin" style="font-weight: normal">Left</label>
		</div>
		<div class="left spacer">
			<input class="form-control" id="right-arrow" type="checkbox" checked={options.rightArrow}
				onClick={e => updateOptions({rightArrow: e.currentTarget.checked})}/>
			<label for="right-arrow" class="no-margin" style="font-weight: normal">Right</label>
		</div>
		<br/>
		<button class="rounded btn-primary btn-large" onClick={onClickAdvanced}>{showAdvanced ? 'Hide Options' : 'Advanced Options'}</button>
		<AdvancedLineOptions options={options} updateOptions={updateOptions} display={showAdvanced}/>
	</div>
}

const AdvancedLineOptions = ({options, updateOptions, display}) => {
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
    	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/></span>
		<br/><br/>
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

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckLine({options, dashboard, slug}) {
	const svgRef = useRef({clientWidth: 100, clientHeight: 40});
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
		const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
		const state = icingaResultCodeToCheckState(options.objectType, res.MaxState);
		res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
		if (state === 'ok') ok = true;
		if (state === 'up') upp = true;
		if (state === 'down') down = true;
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
			const up  = options.upSound     ? new Audio(options.upSound)       : new Audio(dash.upSound);
			const dow = options.downSound   ? new Audio(options.downSound)     : new Audio(dash.downSound);

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
						switch(state){
							case 'up':   if (!upp)  { o.play(); upp = true;  resetState(1,1,1,1,0,1)} break;
							case 'down': if (!down) { w.play(); down = true; resetState(1,1,1,1,1,0)} break;
						}
					}
				}
			}

			if (options.objectType !== null && options.filter !== null) {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
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
		if(options.objectType !== null && options.filter !== null) {
			initState();
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);


	//SVG stroke color and icons to the correct version based
	//on the current check state
	let strokeColor = '';
	if(checkState === 'ok' || checkState === 'up') {
		strokeColor = `var(--color-icinga-green)`
	}
	if(checkState === 'warning') {
		strokeColor = acknowledged ? `#ffca39` : `var(--color-icinga-yellow)`
	}
	if(checkState === 'unknown') {
		strokeColor = acknowledged ? `#b594b5` : `var(--color-icinga-purple)`
	}
	if(checkState === 'critical' || checkState === 'down') {
		strokeColor = acknowledged ? `#de5e84` : `var(--color-icinga-red)`
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
