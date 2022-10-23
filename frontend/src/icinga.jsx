import { h, Fragment, Component } from "preact";

import * as meerkat from "./meerkat";

async function getObjectNames(objectType) {
	let objects;
	switch (objectType) {
		case "host":
			objects = await meerkat.getIcingaHosts();
			break;
		case "host-group":
			objects = await meerkat.getIcingaHostGroups();
			break;
		case "service":
			objects = await meerkat.getIcingaServices();
			break;
		case "service-group":
			objects = await meerkat.getIcingaServiceGroups();
			break;
	}
	const names = objects.map((obj) => obj.id);
	// TODO sort names alphabetically
	return names;
}

export class ObjectSelect extends Component {
	constructor(props) {
		console.log(props);
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
		const names =  await getObjectNames(objectType);
		this.setState({ names: names });
	}

	handleObjectChange(event) {
		const objectName = event.target.value;
		this.props.updateOptions({ id: objectName });
	}

	render() {
		return (
			<fieldset>
				<legend>Icinga object</legend>
				<ObjectTypeSelect
					selected={this.props.objectType}
					onChange={this.handleSelect}
				/>
				<ObjectList
					names={this.state.names}
					value={this.props.objectName}
					onChange={this.handleObjectChange}
				/>
			</fieldset>
		);
	}
}

function ObjectTypeSelect({ selected, onChange }) {
	return (
		<Fragment>
			<label class="form-label">Type</label>
			<select
				class="form-select"
				name="objectType"
				value={selected}
				onChange={onChange}
				required
			>
				<option key="host" value="host">
					Host
				</option>
				<option key="service" value="service">
					Service
				</option>
				<option key="host-group" value="host-group">
					Host Group
				</option>
				<option key="service-group" value="service-group">
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

function ObjectList({ names, value, onChange }) {
	if (!names) {
		return disabledInput;
	}
	let options = names.map((name) => <option value={name}></option>);
	return (
		<Fragment>
			<label class="form-label">Name</label>
			<input
				class="form-control"
				list="object-list"
				name="objectName"
				value={value}
				placeholder="Enter text to search..."
				onChange={onChange}
			/>
			<datalist id="object-list">{options}</datalist>
		</Fragment>
	);
}
