import { h, Fragment } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import * as meerkat from "../meerkat";

export function AudioOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<label for="src">Source</label>
			<input
				class="form-control"
				id="src"
				name="src"
				value={options.audioSource}
				onInput={(e) => updateOptions({ audioSource: e.currentTarget.value })}
			></input>
			<div>
				<button class="rounded btn-primary btn-large">Render</button>
			</div>
		</Fragment>
	);
}

export function AudioStream({ options }, props) {
	return (
		<div class="audio-container">
			<audio
				class="audio-player"
				controls
				src={options.audioSource}
				type="audio/mpeg"
			></audio>
		</div>
	);
}
