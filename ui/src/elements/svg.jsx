import { h, Fragment } from "preact";

import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
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
		</Fragment>
	);
}

export function CheckSVG({ state, objType }) {
	let svg = "help-circle";
	if (state == 0) {
		svg = "check-circle";
	} else if (state == 1) {
		if (objType.startsWith("host")) {
			svg = "alert-octagon"; // host is down
		} else {
			svg = "alert-triangle"; // service is warning
		}
	} else if (state == 2) {
		svg = "alert-octagon";
	}

	let classes = ["feather", "svg", IcingaJS.StateText(state, objType)];
	return (
		<svg class={classes.join(" ")}>
			<use xlinkHref={`/dist/feather-sprite.svg#${svg}`} />
		</svg>
	);
}
