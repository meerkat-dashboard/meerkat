import { h, Fragment } from 'preact';
import { RouterProps, route } from 'preact-router';
import { useState, useEffect, StateUpdater } from 'preact/hooks';

import { Check } from '../editor';

// Value 	Host State 	Service State
// 0 		Up 			OK
// 1 		Up 			Warning
// 2 		Down 		Critical
// 3 		Down 		Unknown

//icinga state matrix: states[type][state]
const states = {
	service: {
		0: 'ok',
		1: 'warning',
		2: 'critical',
		3: 'unknown'
	},
	host: {
		0: 'up',
		1: 'up',
		2: 'down',
		3: 'down'
	}
}

const checkType = (checkID: string) => checkID.includes('!') ? 'service' : 'host';

export function CardElement(props: {check: Check}) {
	const [checkState, setCheckState] = useState(null);

	//Handle state update
	const updateState = () => {
		const id = props.check.checkID;
		const t = checkType(id);

		fetch(`/icinga/${t}s/${encodeURIComponent(id)}`)
			.then(res => res.json())
			.then(res => {
				const state = states[t][res[0].state];
				setCheckState(state);
			});
	}

	//Setup check refresher
	useEffect(() => {
		if(props.check.checkID !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30*1000)
			return () => window.clearInterval(intervalID);
		}
	}, [props.check.checkID]);

	return <div class={"check-content card " + checkState}>
		<p>{props.check.title}</p>
		<div class="check-state">
			{checkState === null ? 'Unconfigured' : checkState}
		</div>
	</div>
}