import { h, Fragment } from 'preact';
import { RouterProps, route } from 'preact-router';
import { useState, useEffect, StateUpdater } from 'preact/hooks';

import { Check } from '../editor';

export function CardElement(props: {check: Check}) {
	return <div class="check-content card">
		<p>{props.check.title}</p>
	</div>
}