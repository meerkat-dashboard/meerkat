import { h, Fragment, Component } from "preact";

import * as meerkat from "./meerkat";

// DefaultCheckInterval is the default duration, in milliseconds,
// which a standard Icinga installation will execute check commands if
// none is set explicitly.
export const DefaultCheckInterval = 60 * 1000;

async function getObjectNames(objectType) {
	const objects = await meerkat.getAll(objectType);
	const names = objects.map((obj) => obj.name);
	return names.sort();
}

export function StateText(state, objectType) {
	if (objectType.toLowerCase() == "host") {
		switch (state) {
			case 0:
				return "ok";
			case 1:
				return "critical";
			default:
				return "unknown";
		}
	}

	switch (state) {
		case 0:
			return "ok";
		case 1:
			return "warning";
		case 2:
			return "critical";
		default:
			return "unknown";
	}
}

// NextRefresh returns an estimated duration until the Icinga HTTP API
// may be queried to detect a change of object state. Date should be the
// date when Icinga will perform its next check (see the next_check field
// from the API).
//
// Lag is the estimated proportion of the duration until the next check
// required for Icinga to update the object state.
// Lag accounts for durations such as check command execution time.
// For example, if the next check is 60 seconds away and lag is set to 0.2,
// the estimated duration returned would be 72 seconds.
// If unset, the default lag is 10% (0.1) of the duration until the next check.
//
// If the next check is in the past (e.g. when objects have been
// unreachable from Icinga for some time), DefaultCheckInterval is
// returned.
export function NextRefresh(date, lag = 0.1) {
	let dur = until(date) + lag*until(date);
	if (dur < 0) {
		return DefaultCheckInterval;
	}
	return dur;
}

function until(date) {
	return date - new Date();
}

export class ObjectSelect extends Component {
	constructor(props) {
		super(props);
		this.state = {
			names: null,
		};
		// if we're initialised with an object type, get a list of all the names so we're ready to go
		if (props.objectType) {
			getObjectNames(props.objectType).then((names) => {
				this.setState({
					names: names,
				});
			});
		}
		this.handleSelect = this.handleSelect.bind(this);
		this.handleObjectChange = this.handleObjectChange.bind(this);
	}

	async handleSelect(event) {
		const objectType = event.target.value;
		this.props.updateOptions({ objectType: objectType });
		const names = await getObjectNames(objectType);
		this.setState({ names: names });
	}

	handleObjectChange(event) {
		const objectName = event.target.value;
		this.props.updateOptions({ objectName: objectName });
	}

	render() {
		return (
			<fieldset>
				<legend>Icinga object</legend>
				<ObjectTypeSelect
					selected={this.props.objectType}
					onInput={this.handleSelect}
				/>
				<ObjectList
					names={this.state.names}
					value={this.props.objectName}
					onInput={this.handleObjectChange}
				/>
			</fieldset>
		);
	}
}

function ObjectTypeSelect({ selected, onInput }) {
	return (
		<Fragment>
			<label class="form-label">Type</label>
			<select
				class="form-select"
				name="objectType"
				value={selected}
				onInput={onInput}
				required
			>
				<option key="host" value="host">
					Host
				</option>
				<option key="service" value="service">
					Service
				</option>
				<option key="hostgroup" value="hostgroup">
					Host Group
				</option>
				<option key="servicegroup" value="servicegroup">
					Service Group
				</option>
			</select>
		</Fragment>
	);
}

const disabledInput = (
	<Fragment>
		<label class="form-label">Name</label>
		<input
			class="form-control"
			type="text"
			placeholder="No object type selected"
			disabled
		/>
	</Fragment>
);

function ObjectList({ names, value, onInput }) {
	if (!names) {
		return disabledInput;
	}
	let options = names.map((name) => <option value={name}>{name}</option>);
	return (
		<Fragment>
			<label class="form-label">Name</label>
			<select
				class="form-select"
				id="object-list"
				value={value}
				onInput={onInput}
			>
				{options}
			</select>
		</Fragment>
	);
}
