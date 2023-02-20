import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import * as Icinga from "../icinga";
import { icingaResultCodeToCheckState } from "../util";
import { svgList } from "../svg-list";
import { ExternalURL } from "./options";

const defaultIcon = {
	ok: "check-circle",
	warning: "alert-triangle",
	critical: "alert-octagon",
	unknown: "help-circle",
};

export function CheckSVGOptions({ options, updateOptions }) {
	const svgOptions = svgList.map((svgName) => (
		<option value={svgName}>{svgName}</option>
	));

	let ok = defaultIcon.ok;
	if (options.okSvg) {
		ok = options.okSvg;
	}
	let warning = defaultIcon.warning;
	if (options.warningSvg) {
		warning = options.warningSvg;
	}
	let critical = defaultIcon.critical;
	if (options.criticalSvg) {
		critical = options.criticalSvg;
	}
	let unknown = defaultIcon.unknown;
	if (options.unknownSvg) {
		unknown = options.unknownSvg;
	}

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

			<SVGSelect
				objState="ok"
				value={ok}
				onInput={(e) => updateOptions({ okSvg: e.currentTarget.value })}
			/>
			<SVGSelect
				objState="warning"
				value={warning}
				onInput={(e) => updateOptions({ warningSvg: e.currentTarget.value })}
			/>
			<SVGSelect
				objState="critical"
				value={critical}
				onInput={(e) => updateOptions({ criticalSvg: e.currentTarget.value })}
			/>
			<SVGSelect
				objState="unknown"
				value={unknown}
				onInput={(e) => updateOptions({ unknownSvg: e.currentTarget.value })}
			/>
		</Fragment>
	);
}

// SVGSelect returns a select element for the given Icinga object state.
function SVGSelect({ objState, value, onInput }) {
	const svgs = svgList.map((svgName) => (
		<option value={svgName}>{svgName}</option>
	));
	let id = `${objState}Svg`;
	return (
		<Fragment>
			<label style="text-transform: capitalize;" for={id}>
				{objState} icon
			</label>
			<select
				class="form-select"
				id={id}
				name={id}
				value={value}
				onInput={onInput}
			>
				{svgs}
			</select>
		</Fragment>
	);
}

export function CheckSVG({ options, dashboard }) {
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
			let dur = Icinga.NextRefresh(next);
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

	let svg = options.unknownSvg;
	if (i2Obj.attrs.state == 0) {
		svg = options.okSvg;
	} else if (i2Obj.attrs.state == 1) {
		if (options.objectType == "host") {
			svg = options.criticalSvg;
		} else {
			svg = options.warningSvg;
		}
	} else if (i2Obj.attrs.state == 2) {
		svg = options.criticalSvg;
	}

	let classes = ["feather", Icinga.StateText(i2Obj.attrs.state, i2Obj.type)];
	return (
		<svg class={classes.join(" ")}>
			<use xlinkHref={`/dist/feather-sprite.svg#${svg}`} />
		</svg>
	);
}
