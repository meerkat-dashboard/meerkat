import { h, Fragment } from 'preact';
import { useState, useEffect} from 'preact/hooks';
import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList } from '../util'

//The rendered view (in the actual dashboard) of the Card Element
export function CheckCard({options, slug, dashboard}) {
	const [checkState, setCheckState] = useState(false);
	const [perfData, setPerfData] = useState(null);
	const [perfValue, setPerfValue] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	let ok = false;
	let warning = false;
	let critical = false;
	let unknown = false;
	let upp = false;
	let down = false;
	let dash = {};

	const initState = async () => {
		setPerfValue(null);
		const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
		if (res === false) {
			window.flash(`This dashboard isn't updating`, 'error')
		}
		const state = icingaResultCodeToCheckState(options.objectType, res.MaxState);
		res.Acknowledged ? setAcknowledged('ack') : setAcknowledged("");
		if (state === 'ok') ok = true;
		if (state === 'warning') warning = true;
		if (state === 'critical') critical = true;
		if (state === 'unknown') unknown = true;
		if (state === 'up') upp = true;
		if (state === 'down') down = true;
	}

	//Handle state update
	const updateState = async () => {
		meerkat.getCheckResult(options.objectType, options.id).then(async c => {
			if (c === false) {
				window.flash(`This dashboard isn't updating`, 'error')
			}
			let perfData = c.results ? c.results[0].attrs.last_check_result.performance_data : null;
			if (perfData !== null) {
				if (typeof perfData !== "undefined" && perfData.length > 0) {
					let arrPerf = [];
					for( var i = 0; i < perfData.length; i++){
						if (perfData[i].includes('=')) {
							arrPerf.push(perfData[i].split(';')[0]);
						}
					}
					let objPerf = Object.fromEntries(arrPerf.map(s => s.split('=')));
					setPerfData(objPerf);
					perfDataSelected(objPerf);
				}
			} else {
				setPerfData(null);
			}
		});

		meerkat.getDashboard(slug).then(async d => {
			if (d === false) {
				window.flash(`This dashboard isn't updating`, 'error')
			}

			dash = await d

			const o   =  options.okSound       ? new Audio(options.okSound)       : new Audio(dash.okSound);
			const w   =  options.warningSound  ? new Audio(options.warningSound)  : new Audio(dash.warningSound);
			const c   =  options.criticalSound ? new Audio(options.criticalSound) : new Audio(dash.criticalSound);
			const u   =  options.unknownSound  ? new Audio(options.unknownSound)  : new Audio(dash.unknownSound);
			const up  =  options.upSound       ? new Audio(options.upSound)       : new Audio(dash.upSound);
			const dow =  options.downSound     ? new Audio(options.downSound)     : new Audio(dash.downSound);

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
						if (o)  ok       = false;
						if (w)  warning  = false;
						if (c)  critical = false;
						if (u)  unknown  = false;
						if (up) up       = false;
						if (d)  down     = false;
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
							case 'up':   if (!upp)  { o.play(); upp = true;   resetState(1,1,1,1,0,1)} break;
							case 'down': if (!down) { w.play(); down = true; resetState(1,1,1,1,1,0)} break;
						}
					}
				}
			}

			if (options.objectType !== null && options.filter !== null) {
					const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
					if (res === false) {
						window.flash(`This dashboard isn't updating`, 'error')
					}
					const state = icingaResultCodeToCheckState(options.objectType, res.MaxState);
					res.Acknowledged ? setAcknowledged('ack') : setAcknowledged("");
					setCheckState(state);
					muteAlerts();
					alertSound(state);
			}
		});
	}

	const perfDataSelected = async (perfData) => {
		let waitPerf = await perfData;
		for (const [key, value] of Object.entries(waitPerf)) {
			if (options.perfDataSelection === key) {
				setPerfValue(value)
			}
		}
	}

	//Setup check refresher
	useEffect(() => {
		if(options.objectType !== null && options.filter !== null) {
			initState();
			updateState();
			const intervalID = window.setInterval(updateState, 5*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter, options.perfDataSelection]);

	return <div class={"check-content card " + checkState + " " + `${checkState}-${acknowledged}`}>
		<div class="check-state" style={`font-size: ${options.statusFontSize}px;` + `line-height: 1.1;`}>
			{perfValue ? Number(perfValue.replace(/[^\d.-]/g, '')) : checkState}
			{acknowledged ? <span><br/><span style="margin-left: 50px;">{acknowledged ? "(ACK)" : ""}</span></span> : ""}
		</div>
	</div>
}

//Card options, displayed in the sidebar
export function CheckCardOptions({options, updateOptions}) {
	const [showAdvanced, setAdvanced] = useState(false);
	const onClickAdvanced = () => showAdvanced ? setAdvanced(false) : setAdvanced(true);

	return <div class="card-options">
		<label>Icinga Host or Service</label>
		<IcingaCheckList currentCheckopts={options}
			updateOptions={updateOptions} />
		<br/>
		<label for="card-linking-url">Linking Url</label>
		<input class="form-control" id="card-linking-url" name="card-linking-url" type="text" value={options.linkURL}
				onInput={e => updateOptions({linkURL: e.currentTarget.value})}>
		</input>
		<label for="status-font-size">Status Font Size</label>
		<input class="form-control" id="status-font-size" value={options.statusFontSize} name="status-font-size" type="number" min="0"
			   onInput={e => updateOptions({statusFontSize: Number(e.currentTarget.value)})}/>
		<PerfDataOptions options={options} updateOptions={updateOptions}/>
		<div></div>
		<button class="rounded btn-primary btn-large mt-2" onClick={onClickAdvanced}>{showAdvanced ? 'Hide Options' : 'Advanced Options'}</button>
		<AdvancedCheckOptions options={options} updateOptions={updateOptions} display={showAdvanced}/>
	</div>
}

const PerfDataOptions = ({options, updateOptions}) => {
	const [perfData, setPerfData] = useState(null);
	const [objID, setObjID] = useState(null);

	useEffect(() => {
		if (!options.perfDataMode) {
			updateOptions({
				perfDataSelection: ''
			})
		}
	}, [options.perfDataMode, options.perfDataSelection])

	setObjID(options.id);

	if (objID !== options.id) {
		meerkat.getCheckResult(options.objectType, options.id).then(async c => {
			let perfData = c.results ? c.results[0].attrs.last_check_result.performance_data : null;
			if (perfData !== null) {
				if (typeof perfData !== "undefined") {
					let arrPerf = [];
					for( var i = 0; i < perfData.length; i++){
						if (perfData[i].includes('=')) {
							arrPerf.push(perfData[i].split(';')[0]);
						}
					}
					let objPerf = Object.fromEntries(arrPerf.map(s => s.split('=')));
					setPerfData(objPerf)
				}
			} else {
				setPerfData(null)
			}
		});
	}

	if(perfData === null) {
		return <div><label>No Performance Data Available</label><br/></div>
	}

	return <Fragment>
		<label id="perf-mode" class="status-font-size">Performance Data Mode</label>
		<input type="checkbox" defaultChecked={options.perfDataMode} onClick={e => updateOptions({perfDataMode: e.currentTarget.checked})} class="form-control perf-data-mode"/>
		{options.perfDataMode ?
			<select onInput={e => updateOptions({perfDataSelection: e.currentTarget.value})} value={options.perfDataSelection}>
				<option value={null} selected disabled>Choose away...</option>
					{Object.keys(perfData).map(perf => (
						<option key={perf} value={perf}>
							{perf.toUpperCase()}
						</option>
					))}
			</select>
		: null}
	</Fragment>
}

const AdvancedCheckOptions = ({options, updateOptions, display}) => {
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