import { h, Fragment, Component } from "preact";
import { useEffect, useState } from "preact/hooks";

import * as meerkat from "../meerkat";
import * as flatten from "../icinga/flatten.js";

async function getObjectNames(objectType) {
	const objects = await meerkat.getAll(objectType);
	const names = objects.map((obj) => obj.name);
	return names.sort();
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
	if (!selected) {
		selected = "";
	}
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
				<option key="default" disabled value="">
					Choose an object type...
				</option>
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
			id="objectName"
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
			<label class="form-label" for="objectName">
				Name
			</label>
			<input
				class="form-control"
				list="objectName"
				placeholder="Type to search..."
				value={value}
				onInput={onInput}
				required
			/>
			<datalist id="objectName">{options}</datalist>
		</Fragment>
	);
}

export function AttrSelect({ objectName, objectType, selected, onInput }) {
	const [obj, setObj] = useState();

	if (!objectName) {
		return noneSelected;
	}

	useEffect(() => {
		meerkat
			.getIcingaObject(objectName, objectType)
			.then((o) => {
				setObj(o);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [objectName, objectType]);

	if (!obj) {
		return noneSelected;
	}

	let keys = flatten.selectExpressions([], obj);
	const options = keys.map((k) => <option value={k}>{k}</option>);
	if (!selected) {
		selected = "state";
	}
	return (
		<Fragment>
			<label class="form-label" for="attrSelect">
				Attribute
			</label>
			<select
				class="form-select"
				name="attrSelect"
				value={selected}
				onInput={onInput}
			>
				{options}
			</select>
			<small class="form-text">
				The selected object attribute will be rendered as the card's text.
			</small>
		</Fragment>
	);
}

const noneSelected = (
	<Fragment>
		<label class="form-label" for="attrSelect">
			Attribute
		</label>
		<input
			class="form-control"
			type="text"
			name="attrSelect"
			id="attrSelect"
			placeholder="No object selected"
			disabled
		/>
		<small class="form-text">
			The selected object attribute will be rendered as the card's text.
		</small>
	</Fragment>
);
