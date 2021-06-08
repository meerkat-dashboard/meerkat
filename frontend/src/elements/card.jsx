import { h, Fragment } from 'preact';
import { useState, useEffect} from 'preact/hooks';
import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, IcingaCheckList, getPerfData, alertSounds } from '../util';

export function CheckCard({options, slug, dashboard}) {
	const [checkState, setCheckState] = useState(null);
	const [perfValue, setPerfValue] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	const updateState = async () => {
		getPerfData(options, perfDataSelected);
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
				res.Acknowledged ? setAcknowledged('ack') : setAcknowledged("");
				setCheckState(icingaResultCodeToCheckState(options.objectType, res.MaxState));
			} catch (error) {
				window.flash(`This dashboard isn't updating: ${error}`, 'error')
			}
		}
	}

	const perfDataSelected = async (perfData) => {
		let waitPerf = await perfData;
		for (const [key, value] of Object.entries(waitPerf)) {
			if (options.perfDataSelection === key) {
				setPerfValue(value)
			}
		}
	}

	alertSounds(checkState, options, dashboard, false);

	useEffect(() => {
		if (options.objectType !== null && options.filter !== null) {
			setPerfValue(null);
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter, options.perfDataSelection]);

	return <div class={"check-content card " + checkState + " " + `${checkState}-${acknowledged}`}>
		<div class="check-state" style={`font-size: ${options.statusFontSize}px; line-height: 1.1;`}>
			{perfValue ? Number(perfValue.replace(/[^\d.-]/g, '')) : <div class="align-center">{checkState}</div>}
			{acknowledged ? <span>(ACK)</span> : ""}
		</div>
	</div>
}

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
			updateOptions({perfDataSelection: ''})
		}
	}, [options.perfDataMode, options.perfDataSelection])

	setObjID(options.id);

	if (objID !== options.id) {
		getPerfData(options, setPerfData);
	}

	if (perfData === null) {
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

	const audioControls = (src) => {
		if(src) {
			return <Fragment>]
				<a target="_blank" href={src}>view</a>
			</Fragment>
		}
		return null;
	}

	return <div style={{display: display ? '' : 'none'}}>
		<br/>
		<label class="status-font-size">Mute Card Alerts</label>
    	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => updateOptions({muteAlerts: e.target.checked})} class="form-control mute-sounds"/></span>
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
		<label for="soundFile">Down Alert Sound {audioControls(options.downSound)} <a onClick={e => updateOptions({downSound: ""})}>default</a></label>
		<input type="file" id="downSound" accept="audio/*"
			   placeholder="Upload an audio file"
			   onInput={e => handleAudioFile('downSound', e.target.files)}>
		</input>
	</div>
}