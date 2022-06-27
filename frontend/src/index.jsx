import { h, render, Fragment } from 'preact';
import { Router } from 'preact-router';

import { Home } from './home';
import { Editor } from './editor';
import { Viewer } from './viewer';
import { Flash } from './flash';
import bus from '../utils/bus';

function Main() {
	return <Fragment>
		<Flash />
		<Router>
			<Home path="/" />
			<Editor path="/edit/:slug" />
			<Viewer path="/view/:slug" />

			<NotFound default/>
		</Router>
		<div title="Meerkat version" class="app-version">{__MEERKAT_VERSION__}</div>
	</Fragment>
}

window.flash = (message, type="success") => bus.emit('flash', ({message, type}));

function NotFound() {
	return <div>404</div>
}

render(<Main />, document.getElementById('app'));