import { h, Fragment, Component } from "preact";
import { useCallback, useEffect, useState, usePrevious } from "preact/hooks";

import { FontSizeInput, ExternalURL, AlignmentInput } from "./options";
import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";

export function ObjectCardOptions({ options, updateOptions }) {
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
			<AlignmentInput updateOptions={updateOptions} options={options} />
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

			<label for="ok-font-color">
				Ok Font Color <a onClick={(e) => clearField(e, "okFontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="ok-font-color"
						name="ok-font-color"
						type="color"
						value={options.okFontColor}
						onInput={(e) =>
							updateOptions({ okFontColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.okFontColor}
					disabled
				></input>
			</div>

			<label for="warning-font-color">
				Warning Font Color{" "}
				<a onClick={(e) => clearField(e, "warningFontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="warning-font-color"
						name="warning-font-color"
						type="color"
						value={options.warningFontColor}
						onInput={(e) =>
							updateOptions({ warningFontColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.warningFontColor}
					disabled
				></input>
			</div>

			<label for="warning-ack-font-color">
				Warning Acknowledged Font Color{" "}
				<a onClick={(e) => clearField(e, "warningAcknowledgedFontColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="warning-ack-font-color"
						name="warning-ack-font-color"
						type="color"
						value={options.warningAcknowledgedFontColor}
						onInput={(e) =>
							updateOptions({
								warningAcknowledgedFontColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.warningAcknowledgedFontColor}
					disabled
				></input>
			</div>

			<label for="unknown-font-color">
				Unknown Font Color{" "}
				<a onClick={(e) => clearField(e, "unknownFontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="unknown-font-color"
						name="unknown-font-color"
						type="color"
						value={options.unknownFontColor}
						onInput={(e) =>
							updateOptions({ unknownFontColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.unknownFontColor}
					disabled
				></input>
			</div>

			<label for="uknown-ack-font-color">
				Unknown Acknowledged Font Color{" "}
				<a onClick={(e) => clearField(e, "unknownAcknowledgedFontColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="unknown-ack-font-color"
						name="unknown-ack-font-color"
						type="color"
						value={options.unknownAcknowledgedFontColor}
						onInput={(e) =>
							updateOptions({
								unknownAcknowledgedFontColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.unknownAcknowledgedFontColor}
					disabled
				></input>
			</div>

			<label for="critical-font-color">
				Critical Font Color{" "}
				<a onClick={(e) => clearField(e, "criticalFontColor")}>clear</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="critical-font-color"
						name="critical-font-color"
						type="color"
						value={options.criticalFontColor}
						onInput={(e) =>
							updateOptions({ criticalFontColor: e.currentTarget.value })
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.criticalFontColor}
					disabled
				></input>
			</div>

			<label for="critical-ack-font-color">
				Critical Acknowledged Font Color{" "}
				<a onClick={(e) => clearField(e, "criticalAcknowledgedFontColor")}>
					clear
				</a>
			</label>
			<div class="input-group mb-3">
				<span class="input-group-text">
					<input
						class="form-control form-control-color"
						id="critical-ack-font-color"
						name="critical-ack-font-color"
						type="color"
						value={options.criticalAcknowledgedFontColor}
						onInput={(e) =>
							updateOptions({
								criticalAcknowledgedFontColor: e.currentTarget.value,
							})
						}
					/>
				</span>
				<input
					type="text"
					class="form-control"
					value={options.criticalAcknowledgedFontColor}
					disabled
				></input>
			</div>
			<Icinga.SoundOptions options={options} updateOptions={updateOptions} />
		</Fragment>
	);
}

export function ObjectCard({ events, options, dashboard }) {
	const [objectState, setObjectState] = useState();
	const [cardText, setCardText] = useState();
	const [cardState, setCardState] = useState();
	const [soundEvent, setSoundEvent] = useState(false);
	const [styles, setStyles] = useState("");

	const parseUpdate = (object) => {
		let objState = stateText(options.objectType, object.state);
		let classes = ["check-content", "card", objState];
		if (object.acknowledged) {
			classes.push(`${objState}-ack`);
		}
		setCardState(classes.join(" "));

		let styles = "height: 100%; display: flex; ";

		if (options.fontSize) {
			styles += `font-size: ${options.fontSize}px; `;
		} else {
			styles += `font-size: 48px; `;
		}
		if (options.textAlign) {
			styles += `justify-content: ${options.textAlign} !important; `;
		} else {
			styles += `justify-content: center !important; `;
		}
		if (options.textVerticalAlign) {
			styles += `align-items: ${options.textVerticalAlign} !important; `;
		} else {
			styles += `align-items: center !important; `;
		}
		if (options.boldText) {
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

		if (objState === "ok" || objState === "up") {
			styles += `color: ${options.okFontColor}; `;
		} else if (objState === "warning") {
			if (object.acknowledged)
				styles += `color: ${options.warningAcknowledgedFontColor}; `;
			else styles += `color: ${options.warningFontColor}; `;
		} else if (objState === "unknown") {
			if (object.acknowledged)
				styles += `color: ${options.unknownAcknowledgedFontColor}; `;
			else styles += `color: ${options.unknownFontColor}; `;
		} else if (objState === "critical" || objState === "down") {
			if (object.acknowledged)
				styles += `color: ${options.criticalAcknowledgedFontColor}; `;
			else styles += `color: ${options.criticalFontColor}; `;
		}
		setStyles(styles);
		setCardText(text);
	};

	const handleEvent = useCallback((event) => {
		if (objectState && objectState.name.includes(event.data)) {
			handleUpdate();
			setSoundEvent(true);
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
		options.okFontColor,
		options.warningFontColor,
		options.unknownFontColor,
		options.criticalFontColor,
		options.fontSize,
	]);

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
		if (dashboard) {
			if (soundEvent)
				IcingaJS.alertSounds(objectState.state, options, dashboard);
		}
		return (
			<div class={cardState}>
				<div class="check-state" style={styles}>
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

export const CheckCardDefaults = {
	fontSize: 48,
	textAlign: "center",
	textVerticalAlign: "center",
	okFontColor: "#000000",
	warningFontColor: "#000000",
	warningAcknowledgedFontColor: "#000000",
	unknownFontColor: "#000000",
	unknownAcknowledgedFontColor: "#000000",
	criticalFontColor: "#ffffff",
	criticalAcknowledgedFontColor: "#000000",
};
