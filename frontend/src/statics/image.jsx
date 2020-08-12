import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export function StaticImageOptions({options, updateOptions}) {
	return <Fragment>
		<label for="image">Image</label>
		<input id="image" name="image" type="file" value={options.image} accept="image/*" 
			onInput={e => updateOptions({image: e.currentTarget.value})}/>
	</Fragment>
}

export function StaticImage({options}) {
	return <div>image todo</div>
}