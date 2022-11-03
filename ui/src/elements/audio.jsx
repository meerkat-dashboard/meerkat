import { h } from "preact";

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
