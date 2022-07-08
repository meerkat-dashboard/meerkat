import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "../meerkat";

export function StaticImageOptions({ options, updateOptions }) {
	const handleImageUpload = async (e) => {
		try {
			const res = await meerkat.uploadFile(e.target.files[0]);
			updateOptions({ image: res.url });
		} catch (e) {
			//TODO improve
			console.log("failed to upload image and set background");
			console.log(e);
		}
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
			<label for="image">Image {imgControls("image")}</label>
			<input
				class="form-control"
				id="image"
				name="image"
				type="file"
				accept="image/*"
				onInput={handleImageUpload}
			/>
		</Fragment>
	);
}

export function StaticImage({ options }) {
	return (
		<div class="check-content image">
			<img src={options.image} />
		</div>
	);
}
