import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { routeParam, removeParam } from './util';
import { route } from 'preact-router';

function StaticListPanel({statics, addStatic}) {
	if(statics.length < 1) {
		return <div class="subtle" style="flex-direction: column; font-size: 16px;">
			<div>No static content added.</div>
			<a onClick={addStatic}>Create static content</a>
		</div>
	}

	const staticList = statics.map((static, index) => (
		<div class="static-item" onClick={ e => routeParam('selectedStaticId', index.toString()) }>
			<div>{static.title}</div>
		</div>
	));

	return <div class="static-list">
		{staticList}
	</div>
}

// export function CheckSettings({selectedCheck, updateCheck}) {
// 	if(selectedCheck === null) {
// 		return null;
// 	}

// 	const updateCheckOptions = (options) => {
// 		const newOptions = Object.assign(selectedCheck.options, options)
// 		updateCheck({...selectedCheck, options: newOptions})
// 	}

// 	const checkTypeOptions = {
// 		'card': <CardOptionFields updateOptions={updateCheckOptions} check={selectedCheck} />,
// 		'svg': <div>svg options</div>,
// 		'image': <div>image options</div>
// 	}

// 	return <div class="editor settings-overlay">
// 		<div class="options">
// 			<div class="left">
// 				<svg class="feather" onClick={e => removeParam('selectedCheckId')}>
// 					<use xlinkHref={`/res/svgs/feather-sprite.svg#chevron-left`}/>
// 				</svg>
// 				<h3 class="no-margin">{selectedCheck.title}</h3>
// 			</div>
// 			<div class="asd">
// 				<label for="name">Name</label>
// 				<input id="name" type="text" placeholder="Cool check" value={selectedCheck.title}
// 					onInput={e => updateCheck({...selectedCheck, title: e.currentTarget.value})} />

// 				<label>Visual Type</label>
// 				<select name="item-type" value={selectedCheck.type}
// 					onInput={e => updateCheck({...selectedCheck, type: e.currentTarget.value})}>
// 					<option value="card">Card</option>
// 					<option value="svg">SVG</option>
// 					<option value="image">Image</option>
// 				</select>

// 				<label>Icinga Host or Service</label>
// 				<IcingaCheckList check={selectedCheck}
// 					updateCheckID={checkID => updateCheck({...selectedCheck, checkID: checkID})} />

// 				{checkTypeOptions[selectedCheck.type]}
// 			</div>
// 		</div>
// 	</div>
// }

//Statics view for the sidebar
export function SidePanelStatics({dashboard, dashboardDispatch}) {
	const addStatic = e => {
		const newId = dashboard.statics.length;
		dashboardDispatch({type: 'addStatic'});
		routeParam('selectedStaticId', newId);
	}

	return <Fragment>
		<div class="lefty-righty" style="margin-bottom: 20px;">
			<h3>Static Content</h3>
			<button class="small" onClick={addStatic}>New</button>
		</div>
		<StaticListPanel statics={dashboard.statics} addStatic={addStatic} />
	</Fragment>
}