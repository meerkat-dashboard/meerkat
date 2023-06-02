import { h, Fragment, Component } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { FontSizeInput, ExternalURL } from "./options";
import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";

export function ObjectCardOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<Icinga.ObjectSelect
				objectType={options.objectType}
				objectName={options.objectName}
				updateOptions={updateOptions}
			/>
			<Icinga.AttrSelect
				objectName={options.objectName}
				objectType={options.objectType}
				selected={options.objectAttr}
				updateOptions={updateOptions}
				objectAttrMatch={options.objectAttrMatch}
				objectAttrNoMatch={options.objectAttrNoMatch}
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

export function ObjectCard({ events, options }) {
	const [objectState, setObjectState] = useState();
	const [cardText, setCardText] = useState();
	const [cardState, setCardState] = useState();

	const parseUpdate = (object) => {
		let objState = stateText(options.objectType, object.state);
		let classes = ["check-content", "card", objState];
		if (object.acknowledged) {
			classes.push(`${objState}-ack`);
		}
		setCardState(classes.join(" "));

		let text;
		if (!options.objectAttr || options.objectAttr == "state") {
			text = objState;
			if (object.acknowledged) text += " (ACK)";
		} else {
			try {
				if (options.objectAttr == "pluginOutput") {
					text = object.output;
				} else {
					text = object.perfdata[options.objectAttr];
				}

				if (options.objectAttrMatch) {
					const regex = text.match(new RegExp(options.objectAttrMatch, "im"));
					if (regex) {
						text = regex.length > 1 ? regex[regex.length - 1] : regex[0];
					} else if (options.objectAttrNoMatch) {
						text = options.objectAttrNoMatch;
					}
				}
			} catch (err) {
				console.error(`render attribute text: ${err.message}`);
			}
		}

		if (text === undefined) {
			if (options.objectAttrNoMatch) {
				text = options.objectAttrNoMatch;
			} else {
				text = objState;
			}
		}
		setCardText(text);
	};

	const handleEvent = useCallback((event) => {
		if (objectState && objectState.name.includes(event.data)) {
			handleUpdate();
		}
	});

	const handleUpdate = () => {
		try {
			if (options.objectType.endsWith("group")) {
				meerkat
					.getAllInGroup(options.objectName, options.objectType)
					.then((data) => {
						let worst = IcingaJS.worstObject(data);
						setObjectState(worst);
						parseUpdate(worst);
					});
			} else if (options.objectType.endsWith("filter")) {
				meerkat
					.getAllFilter(options.objectName, options.objectType)
					.then((data) => {
						let worst = IcingaJS.worstObject(data);
						setObjectState(worst);
						parseUpdate(worst);
					});
			} else {
				meerkat
					.getIcingaObject(options.objectName, options.objectType)
					.then((data) => {
						setObjectState(data);
						parseUpdate(data);
					});
			}
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	};

	useEffect(() => {
		if (!objectState) handleUpdate();

		if (options.objectAttr) {
			events.addEventListener("CheckResult", handleEvent);
		} else {
			events.addEventListener("StateChange", handleEvent);
		}
		return () => {
			events.removeEventListener("CheckResult", handleEvent);
			events.removeEventListener("StateChange", handleEvent);
		};
	}, [handleEvent]);

	if (!objectState) {
		if (options.objectAttrNoMatch) {
			return (
				<div class="check-content card">
					<div class="check-state" style={`font-size: ${options.fontSize}px`}>
						{options.objectAttrNoMatch}
					</div>
				</div>
			);
		} else {
			return <div class="check-content card"></div>;
		}
	} else {
		return (
			<div class={cardState}>
				<div class="check-state" style={`font-size: ${options.fontSize}px`}>
					{cardText}
				</div>
			</div>
		);
	}
}

function stateText(typ, state) {
	if (typ.toLowerCase().includes("host")) {
		switch (state) {
			case 0:
				return "up";
			case 1:
				return "down";
		}
	}
	if (typ.toLowerCase().includes("service")) {
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
