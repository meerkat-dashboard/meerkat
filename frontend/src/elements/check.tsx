import { h, Fragment } from 'preact';
import { RouterProps, route } from 'preact-router';
import { useState, useEffect, StateUpdater } from 'preact/hooks';

import { Check } from '../editor';

export function CardElement(props: {check: Check}) {
	return <p>hello</p>
}