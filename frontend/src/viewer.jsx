import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from './meerkat';
import { CheckCard } from './elements/card';
import { CheckImage } from './elements/image';
import { CheckSVG } from './elements/svg';
import { CheckLine } from './elements/line';

import { StaticText } from './statics/text';
import { StaticSVG } from './statics/svg';
import { StaticImage } from './statics/image';

//Read only page
export function Viewer({slug}) {
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
		if(element.type === 'check-card') { ele = <CheckCard options={element.options}/> }
		if(element.type === 'check-svg') { ele = <CheckSVG options={element.options}/> }
		if(element.type === 'check-image') { ele = <CheckImage options={element.options}/> }
		if(element.type === 'check-line') { ele = <CheckLine options={element.options} /> }
		if(element.type === 'static-text') { ele = <StaticText options={element.options}/> }
		if(element.type === 'static-svg') { ele = <StaticSVG options={element.options}/> }
		if(element.type === 'static-image') { ele = <StaticImage options={element.options}/> }

		return <div class="check" style={{left: left, top: top, width: width, height: height, transform: rotation}}>
			{ele}
		</div>
	});

	const backgroundImage = dashboard.background ? `url(${dashboard.background})` : 'none';
	return <div class="dashboard view-only" style={{backgroundImage: backgroundImage}}>
		{elements}
		{/* <button class="view-only-button" onClick={e => route('/')}>Home</button> */}
	</div>
}