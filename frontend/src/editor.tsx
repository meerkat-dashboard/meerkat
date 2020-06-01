import { h, Fragment } from 'preact';
import { RoutableProps, route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

export function Editor(props: RoutableProps) {
	return <Fragment>
	<div class="dashboard">
		dashboard
	</div>
	<div class="editor">
		<div class="icons">
			<p>hi</p>
			<svg class="feather">
				<use xlinkHref="/res/svgs/feather-sprite.svg#home"/>
			</svg>
		</div>
		<div class="options">
			<h3>Edit Dashboard</h3>
			<select>
				<option value="item-type">Card</option>
				<option value="item-type">SVG</option>
				<option value="item-type">Image</option>
			</select>
		</div>
	</div>
	</Fragment>
}