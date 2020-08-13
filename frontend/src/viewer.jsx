import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from './meerkat';
import { CardElement } from './elements/card';

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
	
	const checks = dashboard.checks.map(check => {
		const left = `${check.rect.x}%`;
		const top = `${check.rect.y}%`;
		const width = `${check.rect.w}%`;
		const height = `${check.rect.h}%`;

		return <div class="check" style={{left: left, top: top, width: width, height: height}}>
			<CardElement check={check} />
		</div>
	});

	const statics = dashboard.statics.map(static_ => {
		const left = `${static_.rect.x}%`;
		const top = `${static_.rect.y}%`;
		const width = `${static_.rect.w}%`;
		const height = `${static_.rect.h}%`;

		let element = null;
		if(static_.type === 'text') { element = <StaticText options={static_.options}/> }
		if(static_.type === 'svg') { element = <StaticSVG options={static_.options}/> }
		if(static_.type === 'image') { element = <StaticImage options={static_.options}/> }

		return <div class="check" style={{left: left, top: top, width: width, height: height}}>
			{element}
		</div>
	});

	const backgroundImage = dashboard.background ? `url(${dashboard.background})` : 'none';
	return <div class="dashboard view-only" style={{backgroundImage: backgroundImage}}>
		{statics}
		{checks}
		<button class="view-only-button" onClick={e => route('/')}>Home</button>
	</div>
}