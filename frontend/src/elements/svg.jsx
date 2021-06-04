import { h, Fragment, options } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from '../meerkat';
import { icingaResultCodeToCheckState, icingaCheckTypeFromId, IcingaCheckList, alertSounds } from '../util';

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
export function CheckSVG({options, dashboard}) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

	const updateState = async () => {
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(options.objectType, options.filter, dashboard);
				if (res === false) window.flash(`This dashboard isn't updating`, 'error')
				res.Acknowledged ? setAcknowledged('ack') : setAcknowledged("");
				setCheckState(icingaResultCodeToCheckState(options.objectType, res.MaxState));
			} catch (error) {
				window.flash("This dashboard isn't updating", 'error')
			}
		}
	}

	useEffect(() => {
		if(options.objectType !== null && options.filter != null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	alertSounds(checkState, options, dashboard);

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
				{/* <a onClick={e => clearAudioFile(e, field)}>clear</a>&nbsp; */}
				<a target="_blank" href={src}>view</a>&nbsp;
			</Fragment>
		}
		return null;
	}

	return <div style={{display: display ? '' : 'none'}}>
	<br/>
	<label class="status-font-size">Mute Card Alerts</label>
	<span><input type="checkbox" defaultChecked={options.muteAlerts} onChange={e => muteAlerts(e)} class="form-control mute-sounds"/></span><br/><br/>
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
