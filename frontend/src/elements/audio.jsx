import { h, Fragment } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import * as meerkat from "../meerkat";

export function AudioOptions({ options, updateOptions }) {
	return (
		<fieldset>
			<label for="src">Source</label>
			<input
				class="form-control"
				id="src"
				name="src"
				placeholder="http://radio.example.com/stream.mp3"
				value={options.audioSource}
				onInput={(e) => updateOptions({ audioSource: e.currentTarget.value })}
			></input>
		</fieldset>
	);
}

export function AudioStream({ options }) {
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
