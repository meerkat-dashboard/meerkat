import { h, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
import { ExternalURL } from "./options";

export function CheckLineOptions({ options, updateOptions }) {
	return (
		<div class="card-options">
			<Icinga.ObjectSelect
				objectType={options.objectType}
				objectName={options.objectName}
				updateOptions={updateOptions}
			/>

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="stroke-width">Stroke width</label>
			<input
				class="form-control"
				id="stroke-width"
				name="stroke-width"
				type="number"
				min="0"
				step="any"
				value={options.strokeWidth}
				onInput={(e) =>
					updateOptions({ strokeWidth: Number(e.currentTarget.value) })
				}
			/>

			<fieldset>
				<legend>Arrowheads</legend>
				<div class="form-check">
					<input
						class="form-check-input"
						id="left-arrow"
						type="checkbox"
						checked={options.leftArrow}
						onClick={(e) =>
							updateOptions({ leftArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="left-arrow">
						Left
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						id="right-arrow"
						type="checkbox"
						checked={options.rightArrow}
						onClick={(e) =>
							updateOptions({ rightArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="right-arrow">
						Right
					</label>
				</div>
			</fieldset>
		</div>
	);
}

export function CheckLine({ options }) {
	const [i2Obj, seti2Obj] = useState();

	const updateObject = async () => {
		let timer;
		try {
			const obj = await meerkat.getIcingaObject(
				options.objectName,
				options.objectType
			);
			seti2Obj(obj);
			const next = new Date(obj.attrs.next_check * 1000);
			let dur = IcingaJS.NextRefresh(next);
			timer = setTimeout(async () => {
				await updateObject();
			}, dur);
			console.debug(
				`updating ${options.objectName} after ${dur / 1000} seconds`
			);
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
		return timer;
	};

	useEffect(() => {
		if (options.objectType && options.objectName) {
			let timer = updateObject();
			return () => window.clearInterval(timer);
		}
	}, [options.objectType, options.objectName]);

	if (!i2Obj) {
		return null;
	}

	let strokeColor = "var(--color-icinga-purple)";
	if (i2Obj.attrs.state == 0) {
		strokeColor = "var(--color-icinga-green)";
	} else if (i2Obj.attrs.state == 1) {
		if (options.objectType.match(/^host/)) {
			strokeColor = "var(--color-icinga-red)"; // host is down
		} else {
			strokeColor = "var(--color-icinga-yellow)"; // service is warning
		}
	} else if (i2Obj.attrs.state == 2) {
		strokeColor = "var(--color-icinga-red)";
	}

	return (
		<svg
			class="check-content svg"
			stroke-linecap="rounded"
			stroke={strokeColor}
			fill={strokeColor}
		>
			<marker
				id="arrow"
				refX="0"
				refY="5"
				viewBox="0 0 10 10"
				markerWidth="5"
				markerHeight="4"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" />
			</marker>
			<line
				x1="10%"
				y1="50%"
				x2="90%"
				y2="50%"
				marker-start={options.leftArrow ? "url(#arrow)" : ""}
				marker-end={options.rightArrow ? "url(#arrow)" : ""}
				stroke-width={options.strokeWidth}
			/>
		</svg>
	);
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true,
};
