import { h, Fragment, Component } from "preact";

import { FontSizeInput, ExternalURL } from "./options";
import * as meerkat from "../meerkat";
import * as Icinga from "../icinga";

export function ObjectCardOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<Icinga.ObjectSelect
				objectType={options.objectType}
				objectName={options.objectName}
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
		</Fragment>
	);
}

export class ObjectCard extends Component {
	/*
	 * objectType: "host", "service"...
	 * objectName "www.example.com!ping4"
	 * fontSize
	 */
	constructor(props) {
		super(props);
		this.state = {};
		this.updateObject = this.updateObject.bind(this);
	}

	async updateObject() {
		if (!this.props.objectName || !this.props.objectType) {
			return; // nothing selected yet
		}

		let dur = 30 * 1000;
		try {
			const obj = await meerkat.getIcingaObject(
				this.props.objectName,
				this.props.objectType
			);
			this.setState(obj);
			const next = new Date(obj.attrs.next_check * 1000);
			dur = Icinga.NextRefresh(next);
		} catch (err) {
			console.error(
				`fetch ${this.props.objectType} ${this.props.objectName}: ${err}`
			);
		}
		this.timer = setTimeout(async () => {
			await this.updateObject();
		}, dur);
		console.debug(
			`updating ${this.props.objectName} after ${dur / 1000} seconds`
		);
	}

	componentDidMount() {
		this.updateObject();
	}

	componentDidUpdate(prevProps) {
		if (
			this.props.objectName != prevProps.objectName &&
			this.props.objectType != prevProps.objectType
		) {
			clearInterval(this.timer);
			this.updateObject();
		}
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		if (!this.state.attrs) {
			return null;
		}
		let objState = stateText(this.props.objectType, this.state.attrs.state);
		let text = objState;
		let classes = ["check-content", "card", objState];
		if (this.state.acknowledged) {
			text += " (ACK)";
			classes.push(`${objState}-ack`);
		}
		return (
			<div class={classes.join(" ")}>
				<div class="check-state" style={`font-size: ${this.props.fontSize}px`}>
					{text}
				</div>
			</div>
		);
	}
}

function stateText(typ, state) {
	if (typ == "host") {
		switch (state) {
			case 0:
				return "up";
			case 1:
				return "down";
		}
	}
	if (typ == "service") {
		switch (state) {
			case 0:
				return "ok";
			case 1:
				return "warning";
			case 2:
				return "critical";
			case 3:
				return "unknown";
		}
	}
	return "";
}
