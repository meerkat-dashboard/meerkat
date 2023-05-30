import { h, Fragment, Component } from "preact";
import { useEffect, useState } from "preact/hooks";

import { FontSizeInput, ExternalURL } from "./options";
import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
import * as flatten from "../icinga/flatten.js";

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
				onChange={(e) => updateOptions({ objectAttr: e.target.value })}
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

export function ObjectCard({
	state,
	objectType,
	objectName,
	objectAttr,
	objectAttrMatch,
	objectAttrNoMatch,
	fontSize,
}) {
	if (!state) {
		return <div class="check-content card"></div>;
	}
	let text;
	const objState = stateText(objectType, state.state);
	if (!objectAttr || objectAttr == "state") {
		text = objState;
		if (state.acknowledged) {
			text += " (ACK)";
		}
	} else {
		try {
			if (objectAttr == "pluginOutput") {
				text = state.output;
			} else {
				text = state.perfdata[objectAttr];
			}
		} catch (err) {
			console.error(`render attribute text: ${err.message}`);
		}
	}

	if (objectAttrMatch) {
		const regexp = new RegExp(objectAttrMatch);
		text = text.match(regexp);
		if (!text && objectAttrNoMatch) {
			text = objectAttrNoMatch;
		}
	}

	let classes = ["check-content", "card", objState];
	if (state.acknowledged) {
		classes.push(`${objState}-ack`);
	}

	return (
		<div class={classes.join(" ")}>
			<div class="check-state" style={`font-size: ${fontSize}px`}>
				{text}
			</div>
		</div>
	);
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
