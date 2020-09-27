import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';

import * as meerkat from './meerkat';
import { CheckCard } from './elements/card';
import { CheckImage } from './elements/image';
import { CheckSVG } from './elements/svg';
import { CheckLine } from './elements/line';
import { AudioStream } from './elements/audio';
import { IframeVideo } from './elements/video';

import { StaticText } from './statics/text';
import { StaticSVG } from './statics/svg';
import { StaticImage } from './statics/image';

//Read only page
export function Viewer({slug, dashboardReducer}) {
	const [dashboard, setDashboard] =  useState(null);

	useEffect(() => {
		meerkat.getDashboard(slug).then(board => setDashboard(board));
	}, [slug]);

	if(dashboard === null) {
		return <div class="loading center subtle">Loading dashboard</div>
	}
	
	const elements = dashboard.elements.map(element => {
		const left = `${element.rect.x}%`;
		const top = `${element.rect.y}%`;
		const width = `${element.rect.w}%`;
		const height = `${element.rect.h}%`;
		console.log(height)
		const rotation = element.rotation ? `rotate(${element.rotation}rad)` : `rotate(0rad)`;

		let ele = null;
		if(element.type === 'check-card') { ele = <CheckCard options={element.options}/> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options}/> }
		if(element.type === 'check-line') { ele = <CheckLine options={element.options} /> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }
		if(element.type === 'iframe-video') { ele = <IframeVideo options={element.options}/> }
		if(element.type === 'audio-stream') { ele = <AudioStream options={element.options}/> }

		return <div class="check" style={{left: left, top: top, width: width, height: height, transform: rotation}}>
			{ele}
		</div>
	});
	
	// style={{Height: height, Width: width}}
	const backgroundImage = dashboard.background ? dashboard.background : 'none';

	return <div class="dashboard view-only">
			<img src={backgroundImage} class="noselect" id="dashboard-dimensions" style="height: 100%; width: 100%;"/>
			{elements}
	</div>
}