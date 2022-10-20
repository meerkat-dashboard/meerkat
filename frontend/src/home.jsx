import { h, Fragment, Component, render } from "preact";
import { useState, useEffect } from "preact/hooks";

import * as meerkat from "./meerkat";

const titleToSlug = (title) => {
	let result = title;
	result = result.toLowerCase();
	result = result.trim();
	result = result.replace(/[_\s]/g, "-");
	return result.replace(/[^a-z0-9\-]/g, "");
};

function CreateDashboardModal({ hide }) {
	const [title, setTitle] = useState("");

	const createDashboard = async (e) => {
		e.preventDefault();
		try {
			//TODO validate SERVER SIDE titleToSlug(title).length > 0
			const newDashboard = {
				title: title,
				tags: [],
				background: null,
				elements: [],
			};

			const res = await meerkat.createDashboard(newDashboard);
		} catch (e) {
			console.log("Failed to create modal");
			console.log(e);
		}
	};

	return (
		<div class="modal-wrap" onMouseDown={hide}>
			<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
				<form onSubmit={createDashboard}>
					<label for="title">Title</label>
					<input
						class="form-control"
						id="title"
						name="title"
						type="text"
						placeholder="New Dashboard"
						value={title}
						onInput={(e) => setTitle(e.currentTarget.value)}
					/>

					<label>Dashboard URL</label>
					<input
						class="form-control"
						type="text"
						value={window.location.href + "view/" + titleToSlug(title)}
						readonly
					/>
					<button class="btn btn-primary mt-3" type="submit">
						Create
					</button>
				</form>
			</div>
		</div>
	);
}

function DeleteConfirmation({ slug, loadDashboards }) {
	const [showConfirmation, setShowConfirmation] = useState(false);

	const closeModal = (e) => {
		e.preventDefault();
		setShowConfirmation(false);
	};

	const deleteDashboard = (e, slug) => {
		e.preventDefault();
		meerkat.deleteDashboard(slug).then(loadDashboards);
		setShowConfirmation(false);
	};

	return (
		<Fragment>
			<button
				class="btn btn-danger btn-sm"
				onClick={(e) => setShowConfirmation(true)}
			>
				Delete
			</button>
			{showConfirmation ? (
				<Modal
					key={`template-modal-${slug}`}
					show={showConfirmation}
					onClose={(e) => closeModal(e)}
				>
					<div class="modal-wrap" id={`id-${slug}`}>
						<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
							<p>
								Are you sure you want to delete this dashboard?
								This cannot be undone.
							</p>
							<button
								class="btn btn-primary"
								type="submit"
								onClick={(e) => closeModal(e)}
							>
								Cancel
							</button>
							<button
								class="btn btn-danger ms-2"
								type="submit"
								onClick={(e) => deleteDashboard(e, slug)}
							>
								Delete
							</button>
						</div>
					</div>
				</Modal>
			) : null
		}
		</Fragment>
	);
}

function CloneDashboard({ dashboard, dashboards }) {
	const clone = async (e) => {
		e.preventDefault();

		dashboards.forEach((board) => {
			if (board.title === dashboard.title) {
				dashboard.title += " clone";
				return;
			}
		});

		try {
			const res = await meerkat.createDashboard(dashboard);
		} catch (e) {
			console.log(`Failed to clone dashboard: ${e}`);
		}
	};

	return <a onClick={(e) => clone(e)}>Clone</a>;
}

function DashboardList({ dashboards, loadDashboards, filter, authEnabled }) {
	if (dashboards === null || dashboards.length == 0) {
		return <div class="subtle">No dashboards found</div>;
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
				<div class="dashboard-listing">
					<a href={`${slug}/view`}>
						<big>{dashboard.title}</big>
					</a>
				</div>
			);
		}
		return (
			<div class="dashboard-listing">
				<a href={`${slug}/view`}>
					<big>{dashboard.title}</big>
				</a>
				<DashboardActions
					dashboard={dashboard}
					dashboards={dashboards}
					loadDashboards={loadDashboards}
				/>
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
			<button
				style="margin-left: 5px; margin-right: 5px"
				class="btn btn-secondary btn-sm"
			>
				<CloneDashboard dashboard={dashboard} dashboards={dashboards} />
			</button>
			<DeleteConfirmation slug={slug} loadDashboards={loadDashboards} />
		</div>
	);
}

function AppHeader() {
	const [showCreate, setShowCreate] = useState(false);
	return (
		<header>
			<h1>Meerkat</h1>
			<button class="btn btn-primary" onClick={(e) => setShowCreate(true)}>
				Create New Dashboard
			</button>
			{showCreate ? (
				<CreateDashboardModal hide={() => setShowCreate(false)} />
			) : null}
		</header>
	);
}
export function Home() {
	const [showModal, setShowModal] = useState(false);
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState("");
	const [authentication, setAuthentication] = useState(false);

	const loadDashboards = () =>
		meerkat.getAllDashboards().then((dbs) => setDashboards(dbs));
	meerkat.authConfigured().then((v) => {
		console.log("auth configured promise resolved with", v);
		setAuthentication(v);
	});

	useEffect(loadDashboards, []);

	return (
		<div class="home">
			<AppHeader />
			<hr />
			<input
				class="form-control mb-3"
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

class Modal extends Component {
	render() {
		if (!this.props.show) {
			return null;
		}
		return <div id="modal-element">{this.props.children}</div>;
	}
}

render(<Home />, document.body);
