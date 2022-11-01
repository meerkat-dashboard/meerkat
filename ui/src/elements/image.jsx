import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";
import { icingaResultCodeToCheckState, IcingaCheckList } from "../util";
import { ExternalURL } from "./options";

export function CheckImageOptions({ options, updateOptions }) {
	const handleImageUpload = async (fieldName, files) => {
		const res = await meerkat.uploadFile(files[0]);
		const opts = {};
		opts[fieldName] = res.url;
		updateOptions(opts);
	};

	const clearField = (e, field) => {
		e.preventDefault();
		let opts = {};
		opts[field] = null;
		updateOptions(opts);
	};

	const imgControls = (field) => {
		if (options[field]) {
			return (
				<Fragment>
					<a onClick={(e) => clearField(e, field)}>clear</a>&nbsp;
					<a target="_blank" href={options[field]}>
						view
					</a>
				</Fragment>
			);
		}
		return null;
	};

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

			<hr />

			<label for="ok-image">OK State Image {imgControls("okImage")}</label>
			<input
				class="form-control"
				id="ok-image"
				name="ok-image"
				type="file"
				accept="image/*"
				onInput={(e) => handleImageUpload("okImage", e.target.files)}
			/>

			<label for="warning-image">
				Warning State Image {imgControls("warningImage")}
			</label>
			<input
				class="form-control"
				id="warning-image"
				name="warning-image"
				type="file"
				accept="image/*"
				onInput={(e) => handleImageUpload("warningImage", e.target.files)}
			/>

			<label for="warning-image">
				Warning Acknowledged State Image{" "}
				{imgControls("warningAcknowledgedImage")}
			</label>
			<input
				class="form-control"
				id="warning-image"
				name="warning-image"
				type="file"
				accept="image/*"
				onInput={(e) =>
					handleImageUpload("warningAcknowledgedImage", e.target.files)
				}
			/>

			<label for="unknown-image">
				Unknown State Image {imgControls("unknownImage")}
			</label>
			<input
				class="form-control"
				id="unknown-image"
				name="unknown-image"
				type="file"
				accept="image/*"
				onInput={(e) => handleImageUpload("unknownImage", e.target.files)}
			/>

			<label for="unknown-image">
				Unknown Acknowledged State Image{" "}
				{imgControls("unknownAcknowledgedImage")}
			</label>
			<input
				class="form-control"
				id="unknown-image"
				name="unknown-image"
				type="file"
				accept="image/*"
				onInput={(e) =>
					handleImageUpload("unknownAcknowledgedImage", e.target.files)
				}
			/>

			<label for="critical-image">
				Critical State Image {imgControls("criticalImage")}
			</label>
			<input
				class="form-control"
				id="critical-image"
				name="critical-image"
				type="file"
				accept="image/*"
				onInput={(e) => handleImageUpload("criticalImage", e.target.files)}
			/>

			<label for="critical-image">
				Critical Acknowledged State Image{" "}
				{imgControls("criticalAcknowledgedImage")}
			</label>
			<input
				class="form-control"
				id="critical-image"
				name="critical-image"
				type="file"
				accept="image/*"
				onInput={(e) =>
					handleImageUpload("criticalAcknowledgedImage", e.target.files)
				}
			/>
		</Fragment>
	);
}

export function CheckImage({ options, dashboard }) {
	const [checkState, setCheckState] = useState(null);
	const [acknowledged, setAcknowledged] = useState("");

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
				res.Acknowledged ? setAcknowledged("ack") : setAcknowledged("");
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
	}
	if (checkState === "warning") {
		source = acknowledged
			? options.warningAcknowledgedImage
			: options.warningImage;
	}
	if (checkState === "unknown") {
		source = acknowledged
			? options.unknownAcknowledgedImage
			: options.unknownImage;
	}
	if (checkState === "critical" || checkState === "down") {
		source = acknowledged
			? options.criticalAcknowledgedImage
			: options.criticalImage;
	}

	return (
		<div class="check-content image">
			<img src={source} />
		</div>
	);
}
