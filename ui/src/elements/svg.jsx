import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import * as Icinga from "./icinga";
import * as IcingaJS from "../icinga/icinga";
import { icingaResultCodeToCheckState } from "../util";
import { svgList } from "../svg-list";
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

	let svg = "help-circle";
	if (i2Obj.attrs.state == 0) {
		svg = "check-circle";
	} else if (i2Obj.attrs.state == 1) {
		if (options.objectType.match(/^host/)) {
			svg = "alert-octagon"; // host is down
		} else {
			svg = "alert-triangle"; // service is warning
		}
	} else if (i2Obj.attrs.state == 2) {
		svg = "alert-octagon";
	}

	let classes = ["feather", IcingaJS.StateText(i2Obj.attrs.state, i2Obj.type)];
	return (
		<svg class={classes.join(" ")}>
			<use xlinkHref={`/dist/feather-sprite.svg#${svg}`} />
		</svg>
	);
}
