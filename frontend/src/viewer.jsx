import { h, options } from 'preact';
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
import { StaticTicker } from './statics/ticker';
import { StaticSVG } from './statics/svg';
import { StaticImage } from './statics/image';
import { getDerivedStateFromProps } from 'react-widgets/lib/SelectList';

//Read only page
export function Viewer({slug, dashboardReducer}) {
	let [dashboard, setDashboard] = useState(null);
	let [vars, setVars] = useState(null);

	const isQuery = () => window.location.search ? true : false;

	useEffect(() => {
		if (isQuery()) {
			meerkat.getDashboard(slug).then(function(dashboard) {
				if (dashboard.hasOwnProperty("variables")) {
					setVars(dashboard.variables);
					const params = window.location.search.substr(1);
					meerkat.getTemplate(slug, params).then(board => setDashboard(board));
				}
			});
		} else {
			meerkat.getDashboard(slug).then(board => setDashboard(board));
		}
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

		if (vars) dashboard['variables'] = vars;
		if(element.type === 'check-card') { ele = <CheckCard options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'check-line') { ele = <CheckLine options={element.options} dashboard={dashboard} slug={slug}/> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-ticker') { ele = <StaticTicker options={element.options}/> }	
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }
		if(element.type === 'iframe-video') { ele = <IframeVideo options={element.options}/> }
		if(element.type === 'audio-stream') { ele = <AudioStream options={element.options}/> }


		if (element.options.linkURL && element.type === 'static-text') {
			if (element.options.linkURL.includes('http') ) {
				ele = <a id="text-link" href={element.options.linkURL} target="_blank">{ele}</a>
			} else {
				ele = <a id="text-link" href={`https://${element.options.linkURL}`} target="_blank">{ele}</a>
			}
		} else if (element.options.linkURL) {
			if (element.options.linkURL.includes('http') ) {
				ele = <a id="a-link" href={element.options.linkURL} target="_blank">{ele}</a>
			} else {
				ele = <a id="a-link" href={`https://${element.options.linkURL}`} target="_blank">{ele}</a>
			}
		}
		console.log(element.type)

		if (element.type === 'static-ticker'){

			return <div class="view-ticker" style={{left: 0, top: top, width: "100vw" , height: height, transform: rotation}}>
			{/* {console.log(ele)} */}
			{ele}

		</div>
		}

		return <div class="check" style={{left: left, top: top, width: width, height: height, transform: rotation}}>
			{ele}
		</div>
	});

	const backgroundImage = dashboard.background ? dashboard.background : null;

	return <div class="dashboard view-only">
		{backgroundImage ? <img src={backgroundImage} class="noselect" style="height: 100%; width: 100%;" id="dashboard-dimensions"/>
						 : <div class="noselect" style="height: 100vh; width: 100vw"></div>}
		{elements}
	</div>
}
