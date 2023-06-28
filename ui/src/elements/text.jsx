import { h, Fragment, Component } from "preact";
import { useCallback, useEffect, useState, usePrevious } from "preact/hooks";

import { FontSizeInput, ExternalURL, AlignmentInput } from "./options";
import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";

export function DynamicTextOptions({ options, updateOptions }) {
	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};
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

			<div class="form-check">
				<input
					class="form-check-input"
					type="checkbox"
					id="bold"
					defaultChecked={options.boldText}
					onChange={(e) => updateOptions({ boldText: e.target.checked })}
				/>
				<label class="form-check-label" for="bold">
					Bold text
				</label>
			</div>

			<AlignmentInput updateOptions={updateOptions} options={options} />

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="font-color">
				Font Color <a onClick={(e) => clearField(e, "fontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="font-color"
						name="font-color"
						type="color"
						value={options.fontColor}
						onInput={(e) => updateOptions({ fontColor: e.currentTarget.value })}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.fontColor}
					disabled
				></input>
			</div>

			<label for="font-color">
				Background Color{" "}
				<a onClick={(e) => clearField(e, "backgroundColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="background-color"
						name="background-color"
						type="color"
						value={options.backgroundColor}
						onInput={(e) =>
							updateOptions({ backgroundColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.backgroundColor}
					disabled
				></input>
			</div>
		</Fragment>
	);
}

export function DynamicText({ events, options }) {
	const [objectState, setObjectState] = useState();
	const [text, setText] = useState("");
	const [styles, setStyles] = useState("");

	const parseUpdate = (object) => {
		let objState = stateText(options.objectType, object.state);

		let styles = "height: 100%; ";

		if (typeof options.fontSize !== "undefined") {
			styles += `font-size: ${options.fontSize}px; `;
		} else {
			styles += `font-size: 22px; `;
		}
		if (typeof options.backgroundColor !== "undefined") {
			styles += `background-color: ${options.backgroundColor}; `;
		}
		if (typeof options.fontColor !== "undefined") {
			styles += `color: ${options.fontColor}; `;
		}
		if (typeof options.textAlign !== "undefined") {
			styles += `justify-content: ${options.textAlign}; `;
		}
		if (typeof options.textVerticalAlign !== "undefined") {
			styles += `align-items: ${options.textVerticalAlign}; `;
		}
		if (typeof options.boldText !== "undefined" && options.boldText) {
			styles += `font-weight: bold; `;
		}

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
				console.error(`render content text: ${err.message}`);
			}
		}

		if (text === undefined) {
			if (options.objectAttrNoMatch) {
				text = options.objectAttrNoMatch;
			} else {
				text = objState;
			}
		}

		setStyles(styles);
		setText(text);
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

	useEffect(() => {
		if (objectState) handleUpdate(objectState);
	}, [
		options.objectAttr,
		options.objectAttrMatch,
		options.objectAttrNoMatch,
		options.objectName,
		options.objectType,
		options.boldText,
		options.textAlign,
		options.textVerticalAlign,
		options.fontColor,
		options.fontSize,
		options.backgroundColor,
	]);

	if (!objectState) {
		if (options.objectAttrNoMatch) {
			return (
				<div class="check-content text" style={styles}>
					{options.objectAttrNoMatch}
				</div>
			);
		} else {
			return <div class="check-content text" style={styles}></div>;
		}
	} else {
		return (
			<div class="check-content text" style={styles}>
				{text}
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

export const DynamicTextDefaults = {
	fontSize: "22",
	fontColor: "#ffffff",
	textAlign: "center",
	textVerticalAlign: "center",
	backgroundColor: "#007bff",
};
