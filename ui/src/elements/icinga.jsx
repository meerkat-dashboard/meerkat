import { h, Fragment, Component } from "preact";
import { useEffect, useState } from "preact/hooks";

import * as meerkat from "../meerkat";
import * as IcingaJS from "../icinga/icinga.js";
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
			names: [],
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
		let filterEnabled = false;
		if (this.props.objectType && this.props.objectType.endsWith("filter")) {
			filterEnabled = true;
		}
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
					disabled={filterEnabled}
				/>
				<FilterInput
					value={this.props.objectName}
					onInput={this.handleObjectChange}
					disabled={!filterEnabled}
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
				<option key="hostfilter" value="hostfilter">
					Host Filter
				</option>
				<option key="servicefilter" value="servicefilter">
					Service Filter
				</option>
			</select>
		</Fragment>
	);
}

function DisabledInput({ label, placeholder }) {
	return (
		<Fragment>
			<label class="form-label">{label}</label>
			<input
				class="form-control"
				type="text"
				placeholder={placeholder}
				disabled
			/>
		</Fragment>
	);
}

function ObjectList({ names, value, onInput, disabled }) {
	if (disabled) {
		return <DisabledInput label="Name" placeholder="Filter expression used" />;
	}

	if (!names && !value) {
		return <DisabledInput label="Name" placeholder="No objects loaded" />;
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

function FilterInput({ value, onInput, disabled }) {
	if (disabled) {
		return (
			<DisabledInput
				label="Filter Expression"
				placeholder="Object(s) selected by name"
			/>
		);
	}
	const placeholder = `match("app*.example.com", service.name)`;
	return (
		<Fragment>
			<label class="form-label">Filter Expression</label>
			<input
				class="form-control"
				placeholder={placeholder}
				value={value}
				onInput={onInput}
			/>
			<small class="form-text">
				Advanced: see the Icinga2 Documentation on how to write filter
				expressions.
			</small>
		</Fragment>
	);
}

export function AttrSelect({
	objectName,
	objectType,
	selected,
	updateOptions,
	objectAttrMatch,
	objectAttrNoMatch,
}) {
	const [obj, setObjectState] = useState();
	const [rows, setRows] = useState();

	if (!objectName) {
		return noneSelected;
	}

	const parseUpdate = (object) => {
		let rows = [];
		for (var key in object.perfdata) {
			rows.push(<option value={key}>{key}</option>);
		}
		rows.push(<option value="pluginOutput">output</option>);
		setRows(rows);
	};

	useEffect(() => {
		try {
			if (objectType.endsWith("group")) {
				meerkat.getAllInGroup(objectName, objectType).then((data) => {
					let worst = IcingaJS.worstObject(data);
					setObjectState(worst);
					parseUpdate(worst);
				});
			} else if (objectType.endsWith("filter")) {
				meerkat.getAllFilter(objectName, objectType).then((data) => {
					let worst = IcingaJS.worstObject(data);
					setObjectState(worst);
					parseUpdate(worst);
				});
			} else {
				meerkat.getIcingaObject(objectName, objectType).then((data) => {
					setObjectState(data);
					parseUpdate(data);
				});
			}
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	}, [objectName, objectType]);

	return (
		<fieldset>
			<legend>Object attribute</legend>
			<label class="form-label" for="attrSelect">
				Attribute
			</label>
			<select
				class="form-select"
				value={selected}
				onChange={(e) => updateOptions({ objectAttr: e.target.value })}
			>
				{rows}
			</select>
			<small class="form-text">
				The selected object attribute will be rendered as the card's text.
			</small>
			<br />
			<label class="form-label" for="attrMatch">
				Regular Expression Match
			</label>
			<input
				class="form-control"
				name="attrMatch"
				placeholder="[a-zA-Z]+"
				value={objectAttrMatch}
				onChange={(e) => updateOptions({ objectAttrMatch: e.target.value })}
			/>
			<small class="form-text">
				Render only the match of this regular expression against the attribute.
				See also Mozilla's Javascript guide{" "}
				<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions">
					Regular Expressions
				</a>
				.
			</small>
			<br />
			<label class="form-label" for="attrNoMatch">
				No match
			</label>
			<input
				class="form-control"
				name="attrNoMatch"
				value={objectAttrNoMatch}
				onChange={(e) => updateOptions({ objectAttrNoMatch: e.target.value })}
			/>
			<small class="form-text">
				Render this text if If there is no match of the regular expression.
			</small>
		</fieldset>
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
