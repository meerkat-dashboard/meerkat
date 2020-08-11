import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { svgList } from './svg-list';
import { routeParam, removeParam } from './util';
import { route } from 'preact-router';

function StaticListPanel({statics, addStatic}) {
	if(statics.length < 1) {
		return <div class="subtle" style="flex-direction: column; font-size: 16px;">
			<div>No static content added.</div>
			<a onClick={addStatic}>Create static content</a>
		</div>
	}

	const staticList = statics.map((s, index) => (
		<div class="static-item" onClick={ e => routeParam('selectedStaticId', index.toString()) }>
			<div>{s.title}</div>
		</div>
	));

	return <div class="static-list">
		{staticList}
	</div>
}

function TextOptions({options, updateOptions}) {
	return <Fragment>
		<label for="text">Text</label>
		<input id="text" name="text" type="text" value={options.text}
			onInput={e => updateOptions({text: e.currentTarget.value})}/>
			
		<label for="font-size">Font Size</label>
		<input id="font-size" name="font-size" type="number" min="0" value={options.statusFontSize}
			onInput={e => updateOptions({statusFontSize: e.currentTarget.value})}/>
	</Fragment>
}

function SVGOptions({options, updateOptions}) {
	const svgOptions = svgList.map(svgName => <option>{svgName}</option>)

	return <Fragment>
		<label for="svg">SVG</label>
		<select id="svg" name="svg">
			{svgOptions}
		</select>

		<label for="color">Color</label>
		<div class="left spacer">
			<input type="color" name="color" id="color" value={options.color}
				onInput={e => updateOptions({color: e.currentTarget.value})}/>
			<input type="text" value={options.color} disabled />
		</div>

		<label for="stroke-width">Stroke width</label>
		<input id="stroke-width" name="stroke-width" type="number" min="0" value={options.strokeWidth}
			onInput={e => updateOptions({strokeWidth: e.currentTarget.value})}/>
	</Fragment>
}

function ImageOptions({options, updateOptions}) {
	return <Fragment>
		<label for="image">Image</label>
		<input id="image" name="image" type="file" value={options.image} accept="image/*" 
			onInput={e => updateOptions({image: e.currentTarget.value})}/>
	</Fragment>
}

export function StaticSettings({selectedStatic, updateStatic}) {
	if(selectedStatic === null) {
		return null;
	}

	const updateOptions = (options) => {
		const newOptions = Object.assign(selectedStatic.options, options)
		updateStatic({...selectedStatic, options: newOptions})
	}

	const staticTypeOptions = {
		'text': <TextOptions updateOptions={updateOptions} options={selectedStatic.options} />,
		'svg': <SVGOptions updateOptions={updateOptions} options={selectedStatic.options} />,
		'image': <ImageOptions updateOptions={updateOptions} options={selectedStatic.options} />,
	}
	const options = staticTypeOptions[selectedStatic.type]

	return <div class="editor settings-overlay">
		<div class="options">
			<div class="lefty-righty spacer">
				<h3 class="no-margin">{selectedStatic.title}</h3>
				<svg class="feather" onClick={e => removeParam('selectedStaticId')}>
					<use xlinkHref={`/res/svgs/feather-sprite.svg#x`}/>
				</svg>
			</div>
			<div class="settings">
				<label for="name">Name</label>
				<input id="name" type="text" placeholder="Sample text.." value={selectedStatic.title}
					onInput={e => updateStatic({...selectedStatic, title: e.currentTarget.value})} />

				<label>Visual Type</label>
				<select name="item-type" value={selectedStatic.type}
					onInput={e => updateStatic({...selectedStatic, type: e.currentTarget.value})}>
					<option value="text">Text</option>
					<option value="svg">SVG</option>
					<option value="image">Image</option>
				</select>
				{options}
			</div>
		</div>
	</div>
}

//Statics view for the sidebar
export function SidePanelStatics({dashboard, dashboardDispatch}) {
	const addStatic = e => {
		const newId = dashboard.statics.length;
		dashboardDispatch({type: 'addStatic'});
		routeParam('selectedStaticId', newId);
	}

	return <Fragment>
		<div class="lefty-righty">
			<h3>Static Content</h3>
			<button class="small" onClick={addStatic}>New</button>
		</div>
		<StaticListPanel statics={dashboard.statics} addStatic={addStatic} />
	</Fragment>
}