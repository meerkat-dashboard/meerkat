import { h } from "preact";

import * as Icinga from "./icinga";
import * as icinga from "../icinga/icinga";
import { ExternalURL } from "./options";

export function CheckLineOptions({ options, updateOptions }) {
	return (
		<div class="card-options">
			<Icinga.ObjectSelect
				objectType={options.objectType}
				objectName={options.objectName}
				updateOptions={updateOptions}
			/>

			<ExternalURL
				value={options.linkURL}
				onInput={(e) => updateOptions({ linkURL: e.currentTarget.value })}
			/>

			<label for="stroke-width">Stroke width</label>
			<input
				class="form-control"
				id="stroke-width"
				name="stroke-width"
				type="number"
				min="0"
				step="any"
				value={options.strokeWidth}
				onInput={(e) =>
					updateOptions({ strokeWidth: Number(e.currentTarget.value) })
				}
			/>

			<fieldset>
				<legend>Arrowheads</legend>
				<div class="form-check">
					<input
						class="form-check-input"
						id="left-arrow"
						type="checkbox"
						checked={options.leftArrow}
						onClick={(e) =>
							updateOptions({ leftArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="left-arrow">
						Left
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						id="right-arrow"
						type="checkbox"
						checked={options.rightArrow}
						onClick={(e) =>
							updateOptions({ rightArrow: e.currentTarget.checked })
						}
					/>
					<label class="form-check-label" for="right-arrow">
						Right
					</label>
				</div>
			</fieldset>
		</div>
	);
}

export function CheckLine({ state, options }) {
	const stateText = icinga.StateText(state, options.objectType)
	return (
		<svg
			class={`check-content svg ${stateText}`}
			stroke-linecap="rounded"
		>
			<marker
				class={stateText}
				id="arrow"
				refX="0"
				refY="5"
				viewBox="0 0 10 10"
				markerWidth="5"
				markerHeight="4"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" />
			</marker>
			<line
				class={stateText}
				x1="10%"
				y1="50%"
				x2="90%"
				y2="50%"
				marker-start={options.leftArrow ? "url(#arrow)" : ""}
				marker-end={options.rightArrow ? "url(#arrow)" : ""}
				stroke-width={options.strokeWidth}
			/>
		</svg>
	);
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true,
};
