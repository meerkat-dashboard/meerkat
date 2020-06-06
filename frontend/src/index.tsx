import { h, render, Fragment } from 'preact';
import { useState, useEffect, useErrorBoundary } from 'preact/hooks';
import { Router, getCurrentUrl, route, RouterProps } from 'preact-router';

import { Home } from './home';
import { Editor } from './editor';

function Main() {
	return <Fragment>
		<Router>
			<Home path="/" />
			<Editor path="/edit/:slug/:view" />

			<NotFound default/>
		</Router>
	</Fragment>
}

function NotFound(props: RouterProps) {
	return <div>404</div>
}

render(<Main />, document.getElementById('app'));