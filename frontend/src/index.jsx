import { h, render, Fragment } from 'preact';
import { Router } from 'preact-router';

import { Home } from './home';
import { Editor } from './editor';
import { Viewer } from './viewer';

function Main() {
	return <Fragment>
		<Router>
			<Home path="/" />
			<Editor path="/edit/:slug/:view" />
			<Viewer path="/view/:slug" />

			<NotFound default/>
		</Router>
	</Fragment>
}

function NotFound() {
	return <div>404</div>
}

render(<Main />, document.getElementById('app'));