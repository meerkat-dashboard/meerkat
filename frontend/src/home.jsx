import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "./meerkat";

const titleToSlug = (title) => {
	let result = title;
	result = result.toLowerCase();
	result = result.trim();
	result = result.replace(/[_\s]/g, "-");
	return result.replace(/[^a-z0-9\-]/g, "");
};

function DashboardList({ dashboards, loadDashboards, filter, authEnabled }) {
	if (dashboards === null || dashboards.length == 0) {
		return;
	}

	const filteredDashboards = dashboards.filter((dashboard) => {
		if (filter === "") {
			return true;
		} else {
			return dashboard.title.toLowerCase().includes(filter.toLowerCase());
		}
	});

	const dbs = filteredDashboards.map((dashboard) => {
		const slug = titleToSlug(dashboard.title);
		if (authEnabled && document.cookie == "") {
			return (
				<div class="dashboard-listing bg-light">
					<a href={`${slug}/view`}>
						<big>{dashboard.title}</big>
					</a>
				</div>
			);
		}
		return (
			<div class="row mb-2 py-2 bg-dark rounded">
				<div class="col">
					<a href={`${slug}/view`}>
						<big>{dashboard.title}</big>
					</a>
				</div>
				<div class="col-md-auto">
				<DashboardActions
					dashboard={dashboard}
					dashboards={dashboards}
					loadDashboards={loadDashboards}
				/>
				</div>
			</div>
		);
	});

	return <Fragment>{dbs}</Fragment>;
}

function DashboardActions({ dashboard, dashboards, loadDashboards }) {
	const slug = titleToSlug(dashboard.title);
	return (
		<div>
			<a href={`${slug}/edit`}>
				<button class="btn btn-primary btn-sm">Edit</button>
			</a>
			<a class="btn btn-danger btn-sm ms-2" href={`${slug}/delete`}>Delete</a>
		</div>
	);
}

export function Home() {
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState("");
	const [authentication, setAuthentication] = useState(false);

	const loadDashboards = () =>
		meerkat.getAllDashboards().then((dbs) => setDashboards(dbs));
	meerkat.authConfigured().then((v) => {
		setAuthentication(v);
	});

	useEffect(loadDashboards, []);

	return (
		<div class="container">
			<input
				class="form-control my-3"
				type="text"
				id="filter"
				onInput={(e) => setFilter(e.currentTarget.value)}
				placeholder="Filter dashboards"
			/>
			<DashboardList
				loadDashboards={loadDashboards}
				dashboards={dashboards}
				filter={filter}
				authEnabled={authentication}
			/>
		</div>
	);
}
