import { h, Fragment, Component } from "preact";
import { useState, useEffect, useCallback, useMemo } from "preact/hooks";

import * as meerkat from "../meerkat";
import {
	icingaResultCodeToCheckState,
	IcingaCheckList,
	getCheckData,
} from "../util";
import { FontSizeInput, ExternalURL } from "./options";

export function CheckCardOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<IcingaCheckList
				currentCheckopts={options}
				updateOptions={updateOptions}
			/>
			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>
			<FontSizeInput
				value={options.fontSize}
				onInput={(e) =>
					updateOptions({ fontSize: Number(e.currentTarget.value) })
				}
			/>
			<CheckDataOptions options={options} updateOptions={updateOptions} />
		</Fragment>
	);
}

const CheckDataOptions = ({ options, updateOptions }) => {
	const [checkData, setCheckData] = useState({});

	useEffect(() => getCheckData(options, setCheckData), [options.id]);

	const optionsSpec = useMemo(() => {
		const result = [];

		if (checkData.performance) {
			Object.keys(checkData.performance).forEach((name) =>
				result.push({
					key: name,
					value: name,
					text: `Performance ${name.toUpperCase()}`,
					selected: options.checkDataSelection === name,
				})
			);
		}
		if (checkData.pluginOutput) {
			result.push({
				key: "pluginOutput",
				value: "pluginOutput",
				text: "Plugin Output",
				selected: options.checkDataSelection === "pluginOutput",
			});
		}

		return result;
	}, [checkData.performance, checkData.pluginOutput]);

	const handleInput = (e) => updateOptions({ [e.target.name]: e.target.value });
	let input;
	if (options.checkDataSelection == "pluginOutput") {
		input = (
			<RegexpInput
				expr={options.checkDataPattern}
				nomatch={options.checkDataDefault}
				onInput={handleInput}
			/>
		);
	}

	return (
		<fieldset>
			<label class="form-label" for="check-data-mode">
				Card text
			</label>
			<select
				class="form-select"
				id="check-data-mode"
				onInput={(e) =>
					updateOptions({ checkDataSelection: e.currentTarget.value })
				}
			>
				<option>Object state</option>
				{optionsSpec.map((spec) => (
					<option key={spec.key} value={spec.value} selected={spec.selected}>
						{spec.text}
					</option>
				))}
			</select>
			{input}
		</fieldset>
	);
};

function RegexpInput({ expr, nomatch, onInput }) {
	return (
		<fieldset>
			<label class="form-label mt-1" for="check-data-regexp">
				Regular expression
			</label>
			<input
				class="form-control mb-1"
				id="check-data-regexp"
				name="checkDataPattern"
				type="text"
				style="font-family: monospace"
				placeholder="[0-9]+"
				onInput={onInput}
				value={expr}
			/>
			<NoMatchInput value={nomatch} onInput={onInput} />
			<small class="form-text">
				If the regular expression results in no matches, this value will be
				displayed.
			</small>
		</fieldset>
	);
}

function NoMatchInput({ value, onInput }) {
	return (
		<Fragment>
			<label class="form-label mt-1" for="check-data-nomatch">
				Value on no match
			</label>
			<input
				class="form-control mb-1"
				id="check-data-nomatch"
				name="checkDataNomatch"
				type="text"
				placeholder="Hello, world!"
				onInput={onInput}
				value={value}
			/>
		</Fragment>
	);
}

export class ObjectStateCard extends Component {
	/*
	 * objectType: "host", "service"...
	 * filter "host.name == "www.example.com""
	 * fontSize
	 */
	constructor(props) {
		super(props);
		this.state = {
			stat: -1,
			acknowledged: false,
		};
	}

	fetchObject(typ, filter) {
		meerkat.getIcingaObjectState(typ, filter).then((worst) => {
			this.setState({
				stat: worst.MaxState,
				acknowledged: worst.Acknowledged,
			});
		});
	}

	componentDidMount() {
		this.fetchObject(this.props.objectType, this.props.filter);
		this.timer = setInterval(() => {
			this.fetchObject(this.props.objectType, this.props.filter);
		}, 30 * 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		let stat = icingaResultCodeToCheckState(
			this.props.objectType,
			this.state.stat
		);
		let classes = ["check-content", "card", stat];
		let cardText = stat;
		if (this.state.acknowledged) {
			cardText += " (ACK)";
			classes.push(`${stat}-ack`);
		}
		return (
			<div class={classes.join(" ")}>
				<div class="check-state" style={`font-size: ${this.props.fontSize}px`}>
					{cardText}
				</div>
			</div>
		);
	}
}
