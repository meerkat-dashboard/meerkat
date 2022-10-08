import { h, Fragment } from "preact";

export function FontSizeInput({ value, onInput }) {
	return (
		<fieldset>
			<label class="form-label" for="font-size">
				Font size
			</label>
			<input
				class="form-control"
				id="font-size"
				value={value}
				name="status-font-size"
				type="number"
				min="8"
				onInput={onInput}
			/>
		</fieldset>
	);
}

export function ExternalURL({ value, onInput }) {
	return (
		<fieldset>
			<label class="form-label" for="card-linking-url">
				External URL
			</label>
			<input
				class="form-control"
				id="external-url"
				name="external-url"
				type="url"
				placeholder="http://www.example.com"
				value={value}
				onInput={onInput}
			></input>
			<small class="form-text">Clicking the element will load this URL.</small>
		</fieldset>
	);
}
