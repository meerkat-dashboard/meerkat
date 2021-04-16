import { h, Fragment, createRef } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';

import * as meerkat from './meerkat';

function CopyTextBox({ text }) {
	const ref = createRef();

	const handleClick = e => {
		ref.current.focus();
		ref.current.select();
		document.execCommand('copy');
		//TODO notification copied!
	}

	return <div class="copy-box" onClick={handleClick}>
		<input class="form-control" ref={ref} type="text" value={text} readOnly />
		<svg class="feather">
			<use xlinkHref={`/res/svgs/feather-sprite.svg#copy`} />
		</svg>
	</div>
}

const titleToSlug = (title) => {
	let result = title;
	result = result.toLowerCase(); //convert upper case to lower case
	result = result.trim() //remove preceeding and trailing whitespace
	result = result.replace(/[_\s]/g, '-'); //convert spaces and underscores to dashes
	result = result.replace(/[^a-z0-9\-]/g, ''); //Remove any other characters

	return result;
}

function CreateDashboardModal({ hide }) {
	const [title, setTitle] = useState('');

	const createDashboard = async e => {
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
			}

			const res = await meerkat.createDashboard(newDashboard);
			route(`/edit/${res.slug}`);
		} catch (e) {
			//TODO
			console.log("Failed to create modal")
			console.log(e)
		}
	}

	return <div class="modal-wrap" onMouseDown={hide}>
		<div class="modal-fixed" onMouseDown={e => e.stopPropagation()}>
			<h3>Create Dashboard</h3>

			<form onSubmit={createDashboard}>
				<label for="title">Title</label>
				<input class="form-control" id="title" name="title" type="text" placeholder="New Dashboard"
					value={title} onInput={e => setTitle(e.currentTarget.value)} />

				<label>Result url</label>
				<CopyTextBox text={window.location.host + '/view/' + titleToSlug(title)} />

				<div class="right" style="margin-top: 20px">
					<button class="rounded btn-primary btn-large" type="submit">Create</button>
				</div>
			</form>
		</div>
	</div>
}

// function TemplateModal({hide, dashboard}) {
// 	const [input, setInput] = useState(null)
// 	const [index, setIndex] = useState(0);
// 	const [dash, setDash] = useState(null);
// 	const [uniqueDash, setUniqueDash] = useState(null);
// 	const [title, setTitle] = useState(null);
// 	const [matchAll, setMatchAll] = useState(true);
// 	const [optionValue, setOptionValue] = useState('');
// 	const [uniqueIndex, setUniqueIndex] = useState(0);

// 	// const reg = /~~[a-Z,0-9]*~~/;

// 	const reg = /~(.*?)~/;

// 	useEffect(() => {
// 		setDash(dashboard);
// 		setUniqueDash([...new Set(dashboard.elements.map(ele => ele.options.filter.match(reg) ? ele.options.filter.match(reg)[1] : null))])
// 	}, []);

// 	const updateTitle = (dashboardIn, value) => {
// 		let newDashboard = JSON.parse(JSON.stringify(dashboardIn));;
// 		newDashboard.title = value;
// 		setDash(newDashboard);
// 		setTitle(value);
// 	}

// 	const updateFilter = (dashboardIn, value, index) => {
// 		let newDashboard = JSON.parse(JSON.stringify(dashboardIn));
// 		newDashboard.elements[index].options.filter = `~${newDashboard.elements[index].options.filter.replace(reg, value)}~`;
// 		setDash(newDashboard);
// 	}

// 	const updateFilterMA = (dashboardIn, value) => {
// 		let newDashboard = JSON.parse(JSON.stringify(dashboardIn));
// 		let selectedOption = `~${document.getElementById("variablesMA").value}~`;
// 		dashboard.elements.forEach(function(ele) {
// 			if (ele.options.filter.includes(selectedOption)) {
// 				newDashboard.elements.forEach(function (newEle) {
// 					if (newEle.options.filter.match(reg) && newEle.options.filter.includes(optionValue)) {
// 						newEle.options.filter = newEle.options.filter.replace(reg, `~${value}~`);
// 						setOptionValue(`~${value}~`);
// 					}
// 				})
// 			}
// 		});
// 		setDash(newDashboard);
// 	}

// 	const updateInput = (dashboardIn, index) => {
// 		let newDashboard = JSON.parse(JSON.stringify(dashboardIn));;
// 		document.getElementById('variable').value = "";
// 		newDashboard.elements[index].options.filter.match(reg)[1];
// 		document.getElementById('variable').value = newDashboard.elements[index].options.filter.match(reg)[1];
// 		setInput(newDashboard.elements[index].options.filter.match(reg)[1]);
// 		setDash(newDashboard);
// 		setIndex(index);
// 	}

// 	const updateInputMA = (dashboardIn, value) => {
// 		let newDashboard = JSON.parse(JSON.stringify(dashboardIn));
// 		document.getElementById('variableMA').value = "";
// 		dashboard.elements.forEach(function(ele, index) {
// 			if (ele.options.filter.includes(`~${value}~`)) {
// 				document.getElementById('variableMA').value = newDashboard.elements[index].options.filter.match(reg)[1];
// 			}
// 		});
// 		setDash(newDashboard);
// 		setInput(value);
// 	}

// 	const createFromTemplate = async e => {
// 		e.preventDefault();
// 		try {
// 			const res = await meerkat.createDashboard(dash);
// 			console.log(res.slug)
// 			route(`/view/${res.slug}`);
// 		} catch (e) {
// 			console.log("Failed to create template")
// 			console.log(e)
// 		}
// 	}

// 	if ((dash || uniqueDash) === null) {
// 		return <div class="modal-wrap">
// 			<div class="modal-fixed">
// 				<h3>Template Settings</h3>
// 				<br />
// 				<div class="subtle loading">Loading Template Vars</div>
// 			</div>
// 		</div>
// 	}

// 	return <div class="modal-wrap" id="" onMouseDown={hide}>
// 		<div class="modal-fixed" onMouseDown={e => e.stopPropagation()}>
// 			<h3>Template Settings</h3>
// 			<br/>
// 			<form onSubmit={createFromTemplate}>
// 				<label for="siteID">Title</label>
// 				<input class="form-control" id="title" name="title" type="text" placeholder="title"
// 					onChange={e => updateTitle(dashboard, e.currentTarget.value)} defaultValue={dashboard.title}/>

// 				<label class="checkbox-inline">
// 					Match All Occurrences <input type="checkbox" checked data-toggle="toggle" onChange={e => setMatchAll(e.currentTarget.checked)}/>
// 				</label><br/>

// 				<label for="variables">Variables</label>
// 				{matchAll ?
// 					<select class="form-control" name="variablesMA" id="variablesMA" onChange={e => {
// 						setOptionValue(`~${e.currentTarget.value}~`);
// 						updateInputMA(dash, e.currentTarget.value);
// 					}}>
// 					<option disabled selected value>Choose..</option>
// 					{uniqueDash.map((element, index) => {
// 						if (element !== null) {
// 							return <option value={element}>
// 								{element}
// 							</option>
// 						}
// 					})}
// 					</select>
// 				:
// 					<select class="form-control" name="variables" id="variables" onChange={e => updateInput(dash, e.currentTarget.value)}>
// 					<option disabled selected value>Choose..</option>
// 					{dash.elements.map((element, index) => {
// 						if (element.options.filter.match(reg)) {
// 							return <option value={index}>
// 								{(element.options.objectType.charAt(0).toUpperCase() + element.options.objectType.slice(1)) + ' variable' + ' - ' + dashboard.elements[index].options.filter.match(reg)[1]}
// 							</option>
// 						}
// 					})}
// 					</select>
// 				}

// 				{matchAll ?
// 					<input class="form-control" id="variableMA" name={"variableMA-" + index} type="text" placeholder="Waiting for selection..."
// 						defaultValue={input} onChange={e => updateFilterMA(dash, e.currentTarget.value)} disabled={input ? false : true} />
// 				:
// 					<input class="form-control" id="variable" name={"variable-" + index} type="text" placeholder="Waiting for selection..."
// 						defaultValue={input} onChange={e => updateFilter(dash, e.currentTarget.value, index)} disabled={input ? false : true} />
// 				}
//  
// 				<div style="font-size: 12px; max-height: 75px; overflow-y: scroll;">
// 					{dash.elements.map((element, index) => {
// 						if (element.options.filter !== dashboard.elements[index].options.filter) {
// 							return <div class="text-success">
// 								&#10004;  {dashboard.elements[index].options.filter.match(reg)[1] + " changed to " + dash.elements[index].options.filter.match(reg)[1]}
// 							</div>
// 						}
// 					})}
// 				</div>

// 				<div class="right" style="margin-top: 20px">
// 					<button class="rounded btn-primary btn-large" type="submit">Create From Template</button>
// 				</div>
// 			</form>
// 		</div>
// 	</div>
// }

function DashboardList({ dashboards, loadDashboards, filter }) {
	const deleteDashboard = slug => meerkat.deleteDashboard(slug).then(loadDashboards);
	// const [showTemplate, setShowTemplate] = useState(false);

	if (dashboards === null) {
		return <div class="subtle loading">Loading Dashboards</div>
	}

	const filteredDashboards = dashboards.filter((dashboard) => {
		if (filter === '') {
			return true;
		} else {
			return dashboard.title.toLowerCase().includes(filter.toLowerCase());
		}
	})

	if (filteredDashboards.length < 1) {
		return <div class="subtle">No dashboards found</div>
	}

	const dbs = filteredDashboards.map(dashboard => {
		const slug = titleToSlug(dashboard.title);
		return <div class="dashboard-listing">
			<h3>{dashboard.title}</h3>
			<div class="timestamps">
				<a onClick={e => route(`/view/${slug}`)}>view</a>
				<a onClick={e => route(`/edit/${slug}`)}>edit</a>
				<a onClick={e => deleteDashboard(slug)}>delete</a>
				{/* <a onClick={e => setShowTemplate(true)}>template</a> */}
				{/* {showTemplate ? <TemplateModal key={`edit-modal-{dashboard.slug}`} hide={() => setShowTemplate(false)} dashboard={dashboard} /> : null} */}
			</div>
		</div>
	});

	return <Fragment>
		{dbs}
	</Fragment>
}

function SettingsModal({ hide }) {
	const [title, setTitle] = useState('');

	const changeSettings = async e => {
		try {
			await meerkat.changeSettings(title);
		} catch (e) {
			console.log("Failed to change settings:")
			console.log(e)
		}
	}

	return <div class="modal-wrap" onMouseDown={hide}>
		<div class="modal-fixed" onMouseDown={e => e.stopPropagation()}>
			<h3>Settings</h3>

			<form onSubmit={changeSettings}>
				<label for="title">App Name</label>
				<input class="form-control" id="title" name="title" type="text" placeholder="New App Name"
					value={title} onInput={e => setTitle(e.currentTarget.value)} />

				<div class="right" style="margin-top: 20px">
					<button class="rounded btn-primary btn-large" type="submit">Submit</button>
				</div>
			</form>
		</div>
	</div>
}

export function Home() {
	const [showModal, setShowModal] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [settings, setSettings] = useState(null);
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState('');

	const loadDashboards = () => meerkat.getAllDashboards().then(dbs => setDashboards(dbs));
	const loadSettings = () => meerkat.getSettings().then(settings => setSettings(settings));

	useEffect(loadDashboards, []);
	useEffect(loadSettings, []);

	return <Fragment>
		<header class="telstra-color-top-border">
			<div class="home">
				<h1 class="title">{settings ? settings.appName : "Meerkat"}</h1>

				<div class="center" style="margin: 25px 0 40px;">
					<button class="rounded btn-primary btn-large" style="left: 18px !important; position: relative;" onClick={e => setShowModal(true)}>Create New Dashboard</button>
					<span onClick={e => setShowSettings(true)}><img class="settings-cog" src="../assets/settings-cogwheel.svg" alt="" /></span>
				</div>

				<div class="filter-wrap">
					<input class="form-control" type="text" id="filter" onInput={e => setFilter(e.currentTarget.value)} placeholder="Filter dashboards" />
				</div>

				<div class="filter-results">
					<DashboardList loadDashboards={loadDashboards} dashboards={dashboards} filter={filter} />
				</div>
			</div>
		</header>

		{showSettings ? <SettingsModal hide={() => setShowSettings(false)} /> : null}
		{showModal ? <CreateDashboardModal hide={() => setShowModal(false)} /> : null}
	</Fragment>
}