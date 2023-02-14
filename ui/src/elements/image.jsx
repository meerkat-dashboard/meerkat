import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import { ExternalURL } from "./options";

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
