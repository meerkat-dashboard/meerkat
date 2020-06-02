import { h } from 'preact';
import { RouterProps, route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

export function Home(props: RouterProps) {
	return <div class="home">
		<h1 class="title">Meerkat</h1>

		<div class="filter-wrap">
			<input type="text" id="filter" placeholder="Filter dashboards" />
			<button onClick={() => route('/edit/settings')}>Create</button>
		</div>

		<div class="filter-results">
			<div class="dashboard-listing">
				<h3>A dashboard name</h3>
				<p>A description</p>
				<div class="timestamps">
					<a href="edit/asd-asd">edit</a>

					<span class="tiny">edited: 19-04-20 - 19:05</span>
					<span class="tiny">created: 19-04-20 - 19:05</span>
				</div>
			</div>
		</div>
	</div>
}