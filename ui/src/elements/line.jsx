import { h } from "preact";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";

import * as Icinga from "./icinga";
import * as icinga from "../icinga/icinga";
import * as meerkat from "../meerkat";
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
			<Icinga.SoundOptions options={options} updateOptions={updateOptions} />
		</div>
	);
}

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckLine({ events, options, dashboard }) {
	const [objectState, setObjectState] = useState();
	const [state, setState] = useState();
	const [soundEvent, setSoundEvent] = useState(false);

	const svgRef = useRef({ clientWidth: 100, clientHeight: 40 });

	const handleUpdate = () => {
		try {
			if (options.objectType.endsWith("group")) {
				meerkat
					.getAllInGroup(options.objectName, options.objectType)
					.then((data) => {
						let worst = icinga.worstObject(data);
						setObjectState(worst);
						setState(icinga.StateText(worst.state, options.objectType));
					});
			} else if (options.objectType.endsWith("filter")) {
				meerkat
					.getAllFilter(options.objectName, options.objectType)
					.then((data) => {
						let worst = icinga.worstObject(data);
						setObjectState(worst);
						setState(icinga.StateText(worst.state, options.objectType));
					});
			} else {
				meerkat
					.getIcingaObject(options.objectName, options.objectType)
					.then((data) => {
						setObjectState(data);
						setState(icinga.StateText(data.state, options.objectType));
					});
			}
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	};

	const handleEvent = useCallback((event) => {
		if (objectState && objectState.name.includes(event.data)) {
			handleUpdate();
			setSoundEvent(true);
		}
	});

	useEffect(() => {
		if (!objectState) handleUpdate();
		events.addEventListener("StateChange", handleEvent);
		return () => {
			events.removeEventListener("StateChange", handleEvent);
		};
	}, [handleEvent]);

	useEffect(() => {
		if (objectState) handleUpdate(objectState);
	}, [options.objectType, options.objectName]);

	if (objectState && dashboard) {
		if (soundEvent) icinga.alertSounds(objectState.state, options, dashboard);
	}
	return (
		<div class={`check-content svg ${state}`} ref={svgRef}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox={`0 0 ${svgRef.current.clientWidth} ${svgRef.current.clientHeight}`}
				fill="none"
				stroke-width={options.strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
				class={state}
			>
				<line
					x1="5"
					y1={svgRef.current.clientHeight / 2}
					x2={svgRef.current.clientWidth - 5}
					y2={svgRef.current.clientHeight / 2}
				></line>
				{options.leftArrow ? (
					<polyline
						points={`30 5 5 ${svgRef.current.clientHeight / 2} 30 ${
							svgRef.current.clientHeight - 5
						}`}
					></polyline>
				) : null}
				{options.rightArrow ? (
					<polyline
						points={`${svgRef.current.clientWidth - 30} 5 ${
							svgRef.current.clientWidth - 5
						} ${svgRef.current.clientHeight / 2} ${
							svgRef.current.clientWidth - 30
						} ${svgRef.current.clientHeight - 5}`}
					></polyline>
				) : null}
			</svg>
		</div>
	);
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true,
};
