import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Link } from 'preact-router/match';

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
		const rotation = element.rotation ? `rotate(${element.rotation}rad)` : `rotate(0rad)`;

		let ele = null;
		if(element.type === 'check-card') { ele = <CheckCard options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-line') { ele = <CheckLine options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }
		if(element.type === 'iframe-video') { ele = <IframeVideo options={element.options}/> }
		if(element.type === 'audio-stream') { ele = <AudioStream options={element.options}/> }

		if (element.options.linkURL) {
			ele = <a id="a-link" href={element.options.linkURL}>{ele}</a>
		}

		return <div class="check" style={{left: left, top: top, width: width, height: height, transform: rotation}}>
			{ele}
		</div>
	});

	// style={{Height: height, Width: width}}
	const backgroundImage = dashboard.background ? dashboard.background : null;

	return <div class="dashboard view-only">
		{backgroundImage ? <img src={backgroundImage} class="noselect" style="height: 100%; width: 100%;" id="dashboard-dimensions"/> 
						 : <div class="noselect" style="height: 100vh; width: 100vw"></div>}
		{elements}
	</div>
}
