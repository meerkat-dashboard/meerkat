import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

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

const checkType = (checkID) => checkID.includes('!') ? 'service' : 'host';

//The rendered view (in the actual dashboard) of the Card Element
export function CardElement(props) {
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
		<p style={`font-size: ${props.check.options.nameFontSize}px`}>{props.check.title}</p>
		<div class="check-state" style={`font-size: ${props.check.options.statusFontSize}px`}>
			{checkState === null ? 'Unconfigured' : checkState}
		</div>
	</div>
}

//Card options, displayed in the sidebar
export function CardOptionFields(props) {
	return <div class="card-options">
		<label for="name-font-size">Name Font Size</label>
		<input id="name-font-size" name="name-font-size" type="number" min="0"
			value={props.check.options.nameFontSize}
			onInput={e => props.updateOptions({nameFontSize: e.currentTarget.value})}/>
			
		<label for="status-font-size">Status Font Size</label>
		<input id="status-font-size" name="status-font-size" type="number" min="0"
			value={props.check.options.statusFontSize}
			onInput={e => props.updateOptions({statusFontSize: e.currentTarget.value})}/>
	</div>
}