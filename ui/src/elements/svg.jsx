import { h, Fragment } from "preact";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";

import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
import * as meerkat from "../meerkat";
import { ExternalURL } from "./options";

export function CheckSVGOptions({ options, updateOptions }) {
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
			<Icinga.SoundOptions options={options} updateOptions={updateOptions} />
		</Fragment>
	);
}

export function CheckSVG({ events, options }) {
	const [objectState, setObjectState] = useState();
	const [cardState, setCardState] = useState();
	const [svg, setSVG] = useState();

	const parseUpdate = (object) => {
		let classes = [
			"feather",
			"svg",
			IcingaJS.StateText(object.state, options.objectType),
		];
		setCardState(classes.join(" "));

		let svg = "help-circle";
		if (object.state == 0) {
			svg = "check-circle";
		} else if (object.state == 1) {
			if (options.objectType.startsWith("host")) {
				svg = "alert-octagon"; // host is down
			} else {
				svg = "alert-triangle"; // service is warning
			}
		} else if (object.state == 2) {
			svg = "alert-octagon";
		}
		setSVG(svg);
	};

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

	const handleEvent = useCallback((event) => {
		if (objectState && objectState.name.includes(event.data)) {
			handleUpdate();
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
	}, [options]);

	return (
		<div class={`check-content svg`}>
			<svg class={cardState}>
				{svg && <use xlinkHref={`/dist/feather-sprite.svg#${svg}`} />}
				{!svg && <use xlinkHref={`/dist/feather-sprite.svg#help-circle`} />}
			</svg>
		</div>
	);
}
