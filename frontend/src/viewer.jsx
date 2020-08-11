import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import { CardElement } from './elements/card';

//Read only page
export function Viewer({slug}) {
	const [dashboard, setDashboard] =  useState(null);

	useEffect(() => {
		fetch(`/dashboard/${slug}`)
			.then(res => res.json())
			.then(res => setDashboard(res));
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

	const backgroundImage = dashboard.background ? `url(${dashboard.background})` : 'none';
	return <div class="dashboard view-only" style={{backgroundImage: backgroundImage}}>
		{checks}
		<button class="view-only-button" onClick={e => route('/')}>Home</button>
	</div>
}