import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import { icingaResultCodeToCheckState, IcingaCheckList } from "../util";
import { svgList } from "../svg-list";
import { ExternalURL } from "./options";

export function CheckSVGOptions({ options, updateOptions }) {
	const svgOptions = svgList.map((svgName) => (
		<option value={svgName}>{svgName}</option>
	));

	return (
		<Fragment>
			<IcingaCheckList
				currentCheckopts={options}
				updateOptions={updateOptions}
			/>

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="okSvg">OK icon</label>
			<select
				class="form-select"
				id="okSvg"
				name="okSvg"
				value={options.okSvg}
				onInput={(e) => updateOptions({ okSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>

			<label for="warningSvg">Warning icon</label>
			<select
				class="form-select"
				id="warningSvg"
				name="warningSvg"
				value={options.warningSvg}
				onInput={(e) => updateOptions({ warningSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>

			<label for="criticalSvg">Critical icon</label>
			<select
				class="form-select"
				id="criticalSvg"
				name="criticalSvg"
				value={options.criticalSvg}
				onInput={(e) => updateOptions({ criticalSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>

			<label for="unknownSvg">Unknown icon</label>
			<select
				class="form-select"
				id="unknownSvg"
				name="unknownSvg"
				value={options.unknownSvg}
				onInput={(e) => updateOptions({ unknownSvg: e.currentTarget.value })}
			>
				{svgOptions}
			</select>
		</Fragment>
	);
}

export function CheckSVG({ options, dashboard }) {
	const [checkState, setCheckState] = useState(null);

	const updateState = async () => {
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(
					options.objectType,
					options.filter,
					dashboard
				);
				if (res === false)
					window.flash(`This dashboard isn't updating`, "error");
				setCheckState(
					icingaResultCodeToCheckState(options.objectType, res.MaxState)
				);
			} catch (error) {
				window.flash("This dashboard isn't updating", "error");
			}
		}
	};

	useEffect(() => {
		if (options.objectType !== null && options.filter != null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30 * 1000);
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	let svgName = "";
	if (checkState === "ok" || checkState === "up") {
		svgName = options.okSvg;
	} else if (checkState === "warning") {
		svgName = options.warningSvg;
	} else if (checkState === "unknown") {
		svgName = options.unknownSvg;
	} else if (checkState === "critical" || checkState === "down") {
		svgName = options.criticalSvg;
	}

	return (
		<svg class={`feather ${checkState}`}>
			<use xlinkHref={`/dist/feather-sprite.svg#${svgName}`} />
		</svg>
	);
}

export const CheckSVGDefaults = {
	okSvg: "check-circle",
	warningSvg: "alert-triangle",
	criticalSvg: "alert-octagon",
	unknownSvg: "help-circle",
};
