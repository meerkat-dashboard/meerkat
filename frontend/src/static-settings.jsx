import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { routeParam, removeParam } from './util';
import { route } from 'preact-router';
import { StaticTextOptions } from './statics/text';
import { StaticSVGOptions } from './statics/svg';
import { StaticImageOptions } from './statics/image';

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

export function StaticSettings({selectedStatic, updateStatic}) {
	if(selectedStatic === null) {
		return null;
	}

	const updateOptions = (options) => {
		const newOptions = Object.assign(selectedStatic.options, options)
		updateStatic({...selectedStatic, options: newOptions})
	}

	const staticTypeOptions = {
		'text': <StaticTextOptions updateOptions={updateOptions} options={selectedStatic.options} />,
		'svg': <StaticSVGOptions updateOptions={updateOptions} options={selectedStatic.options} />,
		'image': <StaticImageOptions updateOptions={updateOptions} options={selectedStatic.options} />,
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
			<button class="small hollow" onClick={addStatic}>New</button>
		</div>
		<StaticListPanel statics={dashboard.statics} addStatic={addStatic} />
	</Fragment>
}