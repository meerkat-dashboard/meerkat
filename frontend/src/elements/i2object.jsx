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
		this.state = {
			stat: -1,
			acknowledged: false,
		};
	}

	fetchObject(typ, name) {
		meerkat.getIcingaObjectState(typ, name);
	}

	componentDidMount() {
		this.fetchObject(this.props.objectType, this.props.objectName);
		this.timer = setInterval(() => {
			this.fetchObject(this.props.objectType, this.props.objectName);
		}, 30 * 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		let objState = stateText(this.props.objectType, this.state.stat);
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
