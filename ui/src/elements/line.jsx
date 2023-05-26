import { h } from "preact";
import { useRef } from 'preact/hooks';

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

//The rendered view (in the actual dashboard) of the Check SVG
export function CheckLine({ state, options }) {
	const stateText = icinga.StateText(state, options.objectType);
	const svgRef = useRef({clientWidth: 100, clientHeight: 40});

	return (
	<div class={`check-content svg ${stateText}`} ref={svgRef}>
		<svg 
			xmlns="http://www.w3.org/2000/svg" 
			viewBox={`0 0 ${svgRef.current.clientWidth} ${svgRef.current.clientHeight}`} 
			fill="none"
			stroke-width={options.strokeWidth} 
			stroke-linecap="round" 
			stroke-linejoin="round"
			class={stateText}
		>
		<line 
			x1="5" 
			y1={svgRef.current.clientHeight / 2} 
			x2={svgRef.current.clientWidth - 5} 
			y2={svgRef.current.clientHeight / 2}
		></line>
			{ options.leftArrow ? <polyline points={`30 5 5 ${svgRef.current.clientHeight / 2} 30 ${svgRef.current.clientHeight - 5}`}></polyline> : null }
			{ options.rightArrow ? <polyline points={`${svgRef.current.clientWidth - 30} 5 ${svgRef.current.clientWidth - 5} ${svgRef.current.clientHeight / 2} ${svgRef.current.clientWidth - 30} ${svgRef.current.clientHeight - 5}`}></polyline> : null }
		</svg>
	</div>
	)
}

export const CheckLineDefaults = {
	strokeWidth: 4,
	leftArrow: false,
	rightArrow: true,
};
