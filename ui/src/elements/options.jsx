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

export function AlignmentInput({ updateOptions, options }) {
	return (
		<Fragment>
			<fieldset>
				<legend>Horizontal alignment</legend>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="horizontal"
						id="starth"
						onInput={(e) => updateOptions({ textAlign: "start" })}
						checked={options.textAlign === "start"}
					/>
					<label class="form-check-label" for="start">
						Start
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="horizontal"
						id="centerh"
						onInput={(e) => updateOptions({ textAlign: "center" })}
						checked={options.textAlign === "center"}
					/>
					<label class="form-check-label" for="center">
						Centre
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="horizontal"
						id="flex-endh"
						onInput={(e) => updateOptions({ textAlign: "flex-end" })}
						checked={options.textAlign === "flex-end"}
					/>
					<label class="form-check-label" for="flex-end">
						End
					</label>
				</div>
			</fieldset>

			<fieldset>
				<legend>Vertical alignment</legend>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="vertical"
						id="startv"
						onInput={(e) => updateOptions({ textVerticalAlign: "start" })}
						checked={options.textVerticalAlign === "start"}
					/>
					<label class="form-check-label" for="start">
						Top
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="vertical"
						id="centerv"
						onInput={(e) => updateOptions({ textVerticalAlign: "center" })}
						checked={options.textVerticalAlign === "center"}
					/>
					<label class="form-check-label" for="center">
						Centre
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="vertical"
						id="endv"
						onInput={(e) => updateOptions({ textVerticalAlign: "end" })}
						checked={options.textVerticalAlign === "end"}
					/>
					<label class="form-check-label" for="end">
						Bottom
					</label>
				</div>
			</fieldset>
		</Fragment>
	);
}
