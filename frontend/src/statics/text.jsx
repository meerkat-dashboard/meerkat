import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export function StaticTextOptions({options, updateOptions}) {
	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	}

	return <Fragment>
		<label for="text">Text</label>
		<textarea class="form-control" id="text" name="text" value={options.text}
			onInput={e => updateOptions({text: e.currentTarget.value})}>
		</textarea>

		<label for="font-size">Font Size</label>
		<input class="form-control" id="font-size" name="font-size" type="number" min="0" value={options.fontSize}
			onInput={e => updateOptions({fontSize: e.currentTarget.value})}/>

		<label>Text Alignment</label>
		<div class="selection" style="margin-bottom: 5px;">
			<button class={`selector ${options.textAlign === 'start' ? 'active' : ''}`}
				onClick={e => updateOptions({textAlign: 'start'})}>Left</button>
			<button class={`selector ${options.textAlign === 'center' ? 'active' : ''}`}
				onClick={e => updateOptions({textAlign: 'center'})}>Center</button>
			<button class={`selector ${options.textAlign === 'flex-end' ? 'active' : ''}`}
				onClick={e => updateOptions({textAlign: 'flex-end'})}>Right</button>
		</div>

		<div class="selection spacer">
			<button class={`selector ${options.textVerticalAlign === 'start' ? 'active' : ''}`}
				onClick={e => updateOptions({textVerticalAlign: 'start'})}>Top</button>
			<button class={`selector ${options.textVerticalAlign === 'center' ? 'active' : ''}`}
				onClick={e => updateOptions({textVerticalAlign: 'center'})}>Middle</button>
			<button class={`selector ${options.textVerticalAlign === 'end' ? 'active' : ''}`}
				onClick={e => updateOptions({textVerticalAlign: 'end'})}>Bottom</button>
		</div>

		<label for="card-linking-url">Linking Url</label>
		<input class="form-control" id="card-linking-url" name="card-linking-url" type="text" value={options.linkURL}
				onInput={e => updateOptions({linkURL: e.currentTarget.value})}>
		</input>

		<label for="font-color">Font Color <a onClick={e => clearField(e, 'fontColor')}>clear</a></label>
		<div class="lefty-righty spacer">
			<input class="form-control" id="font-color" name="font-color" type="color" value={options.fontColor}
				onInput={e => updateOptions({fontColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.fontColor} disabled/>
		</div>

		<label for="background-color">Background Color <a onClick={e => clearField(e, 'backgroundColor')}>clear</a></label>
		<div class="lefty-righty spacer">
			<input class="form-control" id="background-color" name="background-color" type="color" value={options.backgroundColor}
				onInput={e => updateOptions({backgroundColor: e.currentTarget.value})}/>
			<input class="form-control" type="text" value={options.backgroundColor} disabled/>
		</div>
	</Fragment>
}

export function StaticText({options}) {
	let styles = '';

	if(typeof options.fontSize !== 'undefined') {
		styles += `font-size: ${options.fontSize}px; `;
	}
	if(typeof options.backgroundColor !== 'undefined') {
		styles += `background-color: ${options.backgroundColor}; `;
	}
	if(typeof options.fontColor !== 'undefined') {
		styles += `color: ${options.fontColor}; `;
	}
	if(typeof options.textAlign !== 'undefined') {
		styles += `justify-content: ${options.textAlign}; `;
	}
	if(typeof options.textVerticalAlign !== 'undefined') {
		styles += `align-items: ${options.textVerticalAlign}; `;
	}

	return <div class="check-content text">
		<div class ="inner-text" style={styles}>{options.text}</div>
	</div>
}

export const StaticTextDefaults = {
	text: 'sample message',
	fontSize: '22',
	fontColor: '#ffffff',
	textAlign: 'center',
	textVerticalAlign: 'center',
	backgroundColor: '#007bff'
}