import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import { icingaResultCodeToCheckState, IcingaCheckList } from "../util";
import { ExternalURL } from "./options";

export function CheckImageOptions({ options, updateOptions }) {
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

			<CheckImageInput
				objState="ok"
				value={options.okImage}
				onInput={(e) => updateOptions({ okImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="warning"
				value={options.warningImage}
				onInput={(e) => updateOptions({ warningImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="warning (acknowledged)"
				value={options.warningAcknowledgedImage}
				onInput={(e) => updateOptions({ warningAcknowledgedImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="critical"
				value={options.criticalImage}
				onInput={(e) => updateOptions({ criticalImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="critical (acknowledged)"
				value={options.criticalAcknowledgedImage}
				onInput={(e) => updateOptions({ criticalAcknowledgedImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="unknown"
				value={options.unknownImage}
				onInput={(e) => updateOptions({ unknownImage: e.currentTarget.value })}
			/>
			<CheckImageInput
				objState="unknown (acknowledged)"
				value={options.unknownAcknowledgedImage}
				onInput={(e) => updateOptions({ unknownAcknowledgedImage: e.currentTarget.value })}
			/>
		</Fragment>
	);
}

function CheckImageInput({ objState, value, onInput }) {
	// trim acknowledged suffix, to get "http://example.com/critical.png"
	let placeholder = "http://example.com/" + objState.replace(/ \(acknowledged\)$/, "") + ".png"
	return (
		<Fragment>
			<label style="text-transform: capitalize" for={objState}>{objState} image</label>
			<input
				class="form-control"
				id={objState}
				name={objState}
				value={value}
				placeholder={placeholder}
				type="url"
				onInput={onInput}
			/>
		</Fragment>
	);
}

export function CheckImage({ options, dashboard }) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState(false);

	const updateState = async () => {
		if (options.objectType !== null && options.filter !== null) {
			try {
				const res = await meerkat.getIcingaObjectState(
					options.objectType,
					options.filter,
					dashboard
				);
				if (res === false) {
					window.flash(`This dashboard isn't updating`, "error");
				}
				setAcknowledged(res.Acknowledged);
				setCheckState(
					icingaResultCodeToCheckState(options.objectType, res.MaxState)
				);
			} catch (error) {
				window.flash("This dashboard isn't updating", "error");
			}
		}
	};

	useEffect(() => {
		if (options.objectType !== null && options.filter !== null) {
			updateState();
			const intervalID = window.setInterval(updateState, 30 * 1000);
			return () => window.clearInterval(intervalID);
		}
	}, [options.objectType, options.filter]);

	let source = null;
	if (checkState === "ok" || checkState === "up") {
		source = options.okImage;
	} else if (checkState === "warning") {
		source = acknowledged
			? options.warningAcknowledgedImage
			: options.warningImage;
	} else if (checkState === "unknown") {
		source = acknowledged
			? options.unknownAcknowledgedImage
			: options.unknownImage;
	} else if (checkState === "critical" || checkState === "down") {
		source = acknowledged
			? options.criticalAcknowledgedImage
			: options.criticalImage;
	}
	return <Image source={source} />;
}

export function ImageOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<label for="image">Source</label>
			<input
				class="form-control"
				id="image"
				name="image"
				type="url"
				placeholder="http://www.example.com/hello.png"
				value={options.image}
				onChange={(e) => updateOptions({ image: e.currentTarget.value })}
			/>
		</Fragment>
	);
}

export function Image({ source }) {
	return (
		<div class="check-content image">
			<img src={source} />
		</div>
	);
}
