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
				name="fontSize"
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
				value={value ? value : ""}
				onInput={onInput}
			></input>
			<small class="form-text">Clicking the element will load this URL.</small>
		</fieldset>
	);
}

export function AlignmentInput() {
	return (
		<Fragment>
			<fieldset>
				<legend>Horizontal alignment</legend>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="horizontal" id="startAlign" />
					<label class="form-check-label" for="startAlign">
						Start
					</label>
				</div>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="horizontal" id="centerAlign" />
					<label class="form-check-label" for="centerAlign">
						Centre
					</label>
				</div>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="horizontal" id="endAlign" />
					<label class="form-check-label" for="endAlign">
						End
					</label>
				</div>
			</fieldset>

			<fieldset>
				<legend>Vertical alignment</legend>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="vertical" id="topAlign" />
					<label class="form-check-label" for="topAlign">
						Top
					</label>
				</div>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="vertical" id="vcenterAlign" />
					<label class="form-check-label" for="vcenterAlign">
						Centre
					</label>
				</div>
				<div class="form-check">
					<input class="form-check-input" type="radio" name="vertical" id="bottomAlign" />
					<label class="form-check-label" for="bottomAlign">
						Bottom
					</label>
				</div>
			</fieldset>
		</Fragment>
	);
}
