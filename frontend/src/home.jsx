import { h, Fragment, createRef } from "preact";
import { route } from "preact-router";
import { useState, useEffect } from "preact/hooks";
import { Modal } from "./modal";

import * as meerkat from "./meerkat";

function CopyTextBox({ text }) {
	const ref = createRef();

	const handleClick = (e) => {
		ref.current.focus();
		ref.current.select();
		document.execCommand("copy");
	};

	return (
		<div class="copy-box" onClick={handleClick}>
			<input class="form-control" ref={ref} type="text" value={text} readOnly />
			<svg class="feather">
				<use xlinkHref={`/res/svgs/feather-sprite.svg#copy`} />
			</svg>
		</div>
	);
}

const titleToSlug = (title) => {
	let result = title;
	result = result.toLowerCase();
	result = result.trim();
	result = result.replace(/[_\s]/g, "-");
	result = result.replace(/[^a-z0-9\-]/g, "");

	return result;
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
				globalMute: true,
				variables: {},
				okSound: "/dashboards-data/ok.mp3",
				criticalSound: "/dashboards-data/critical.mp3",
				warningSound: "/dashboards-data/warning.mp3",
				unknownSound: "/dashboards-data/unknown.mp3",
				upSound: "/dashboards-data/up.mp3",
				downSound: "/dashboards-data/down.mp3",
			};

			const res = await meerkat.createDashboard(newDashboard);
			route(`/edit/${res.slug}`);
		} catch (e) {
			console.log("Failed to create modal");
			console.log(e);
		}
	};

	return (
		<div class="modal-wrap" onMouseDown={hide}>
			<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
				<h3>Create Dashboard</h3>

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

					<label>Result url</label>
					<CopyTextBox
						text={window.location.host + "/view/" + titleToSlug(title)}
					/>

					<div class="right" style="margin-top: 20px">
						<button class="rounded btn-primary btn-large" type="submit">
							Create
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function TemplateModal({ slug }) {
	const [showTemplate, setShowTemplate] = useState(null);
	const [dashboard, setDashboard] = useState(null);
	const [inputs, setInputs] = useState([]);

	useEffect(() => {
		meerkat.getDashboard(slug).then((options) => populateInputs(options));
		meerkat.getDashboard(slug).then((board) => setDashboard(board));
	}, []);

	const viewFromTemplate = (e) => {
		e.preventDefault(e);

		if (dashboard.hasOwnProperty("variables")) {
			let vars = {};
			for (const [_, property] of Object.entries(inputs)) {
				vars[property.key] = property.val;
			}

			const params = new URLSearchParams(vars).toString();

			try {
				route(`/view/${slug}?${params}`);
			} catch (e) {
				console.log("Failed to create template");
				console.log(e);
			}
		}
	};

	const populateInputs = (board) => {
		let exist = [];
		if (board.hasOwnProperty("variables")) {
			let i = 0;
			for (const [key, value] of Object.entries(board.variables)) {
				exist.push({ ["id"]: i++, ["key"]: key, ["val"]: value });
			}
		}
		setInputs(exist);
	};

	const updateKey = (id, ent) => {
		const key = ent.target.value;
		const updatedInputs = inputs.map((ent, index) =>
			index === id ? { ...ent, key: key } : ent
		);
		setInputs(updatedInputs);
	};

	const updateValue = (id, ent) => {
		const val = ent.target.value;
		const updatedInputs = inputs.map((ent, index) =>
			index === id ? { ...ent, val: val } : ent
		);
		setInputs(updatedInputs);
	};

	const closeModal = (e) => {
		e.preventDefault();
		setShowTemplate(false);
	};

	if (showTemplate && typeof dashboard === "undefined") {
		return (
			<div class="modal-wrap">
				<div class="modal-fixed">
					<h3>Template Settings</h3>
					<br />
					<div class="subtle loading">Loading Template Vars</div>
				</div>
			</div>
		);
	}

	const isTemplate = () => {
		if (
			dashboard &&
			dashboard.hasOwnProperty("variables") &&
			Object.keys(dashboard.variables).length
		) {
			return <a onClick={(e) => setShowTemplate(true)}>template</a>;
		}

		return "";
	};

	return (
		<Fragment>
			{isTemplate()}
			{showTemplate ? (
				<Modal
					key={`template-modal-${slug}`}
					show={showTemplate}
					onClose={(e) => closeModal(e)}
				>
					<div class="modal-wrap" id={`id-${slug}`}>
						<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
							<label class="template-label">Template Settings</label>

							<form>
								<label for="variables" class="template-label">
									Variables
								</label>
								<div class="form-row">
									{inputs.map((entry, i) => (
										<div class="form-row" key={entry.id}>
											<div class="col-md-6" key={i}>
												<label for={`var${i}_key`} class="label-reset">
													Name
												</label>
												<input
													value={entry.key}
													id={`var${i}_key`}
													name={`var${i}_key`}
													class="form-control h-30p"
													onChange={(ent) => updateKey(i, ent)}
													readonly
												/>
											</div>
											<div class="col-md-6" key={i}>
												<label for={`var${i}_val`} class="label-reset">
													Value
												</label>
												<input
													value={entry.val}
													id={`var${i}_val`}
													name={`var${i}_val`}
													class="form-control h-30p"
													onChange={(ent) => updateValue(i, ent)}
												/>
											</div>
										</div>
									))}
								</div>
								<div class="right mt-2">
									<button
										class="rounded btn-primary btn-large mr-2"
										type="submit"
										onClick={(e) => closeModal(e)}
									>
										Close
									</button>
									<button
										class="rounded btn-primary btn-large"
										type="submit"
										onClick={(e) => viewFromTemplate(e)}
									>
										View
									</button>
								</div>
							</form>
						</div>
					</div>
				</Modal>
			) : (
				""
			)}
		</Fragment>
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
			<a onClick={(e) => setShowConfirmation(true)}>delete</a>
			{showConfirmation ? (
				<Modal
					key={`template-modal-${slug}`}
					show={showConfirmation}
					onClose={(e) => closeModal(e)}
				>
					<div class="modal-wrap" id={`id-${slug}`}>
						<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
							<label class="template-label">
								Are you sure you want to delete this dashboard?
							</label>
							<br />
							<button
								class="rounded btn-primary btn-large mr-2"
								type="submit"
								onClick={(e) => closeModal(e)}
							>
								No
							</button>
							<button
								class="rounded btn-primary btn-large"
								type="submit"
								onClick={(e) => deleteDashboard(e, slug)}
							>
								Yes
							</button>
						</div>
					</div>
				</Modal>
			) : (
				""
			)}
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
			route(`/edit/${res.slug}`);
		} catch (e) {
			console.log(`Failed to clone dashboard: ${e}`);
		}
	};

	return (
		<Fragment>
			<a onClick={(e) => clone(e)}>clone</a>
		</Fragment>
	);
}

function DashboardList({ dashboards, loadDashboards, filter }) {
	if (dashboards === null) {
		return <div class="subtle loading">Loading Dashboards</div>;
	}

	const filteredDashboards = dashboards.filter((dashboard) => {
		if (filter === "") {
			return true;
		} else {
			return dashboard.title.toLowerCase().includes(filter.toLowerCase());
		}
	});

	if (filteredDashboards.length < 1) {
		return <div class="subtle">No dashboards found</div>;
	}

	const dbs = filteredDashboards.map((dashboard) => {
		const slug = titleToSlug(dashboard.title);
		if (meerkat.authConfigured() && document.cookie == "") {
			return (
				<div class="dashboard-listing">
					<h3>{dashboard.title}</h3>
					<div class="timestamps">
						<a href={`/view/${slug}`}>view</a>
						<TemplateModal slug={slug} />
					</div>
				</div>
			);
		}
		return (
			<div class="dashboard-listing">
				<h3>{dashboard.title}</h3>
				<div class="timestamps">
					<a href={`/view/${slug}`}>view</a>
					<a href={`/edit/${slug}`}>edit</a>
					<CloneDashboard dashboard={dashboard} dashboards={dashboards} />
					<DeleteConfirmation slug={slug} loadDashboards={loadDashboards} />
					<TemplateModal slug={slug} />
				</div>
			</div>
		);
	});

	return <Fragment>{dbs}</Fragment>;
}

function SettingsModal({ hide }) {
	const [title, setTitle] = useState("");

	const changeSettings = async (e) => {
		try {
			await meerkat.changeSettings(title);
		} catch (e) {
			console.log("Failed to change settings:");
			console.log(e);
		}
	};

	return (
		<div class="modal-wrap" onMouseDown={hide}>
			<div class="modal-fixed" onMouseDown={(e) => e.stopPropagation()}>
				<h3>Settings</h3>

				<form onSubmit={changeSettings}>
					<label for="title">App Name</label>
					<input
						class="form-control"
						id="title"
						name="title"
						type="text"
						placeholder="New App Name"
						value={title}
						onInput={(e) => setTitle(e.currentTarget.value)}
					/>

					<div class="right" style="margin-top: 20px">
						<button class="rounded btn-primary btn-large" type="submit">
							Submit
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export function Home() {
	const [showModal, setShowModal] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [settings, setSettings] = useState(null);
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState("");

	const loadDashboards = () =>
		meerkat.getAllDashboards().then((dbs) => setDashboards(dbs));
	const loadSettings = () =>
		meerkat.getSettings().then((settings) => setSettings(settings));

	useEffect(loadDashboards, []);
	useEffect(loadSettings, []);

	return (
		<Fragment>
			<header class="telstra-color-top-border">
				<div class="home">
					<h1 class="title">{settings ? settings.appName : "Meerkat"}</h1>

					<div class="center" style="margin: 25px 0 40px;">
						<button
							class="rounded btn-primary btn-large"
							style="left: 18px !important; position: relative;"
							onClick={(e) => setShowModal(true)}
						>
							Create New Dashboard
						</button>
						<span onClick={(e) => setShowSettings(true)}>
							<img
								class="settings-cog"
								src="../assets/settings-cogwheel.svg"
								alt=""
							/>
						</span>
					</div>

					<div class="filter-wrap">
						<input
							class="form-control"
							type="text"
							id="filter"
							onInput={(e) => setFilter(e.currentTarget.value)}
							placeholder="Filter dashboards"
						/>
					</div>

					<div class="filter-results">
						<DashboardList
							loadDashboards={loadDashboards}
							dashboards={dashboards}
							filter={filter}
						/>
					</div>
				</div>
			</header>

			{showSettings ? (
				<SettingsModal hide={() => setShowSettings(false)} />
			) : null}
			{showModal ? (
				<CreateDashboardModal hide={() => setShowModal(false)} />
			) : null}
		</Fragment>
	);
}
