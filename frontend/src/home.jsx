import { h, Fragment, createRef } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import * as meerkat from './meerkat';

function CopyTextBox({text}) {
	const ref = createRef();

	const handleClick = e => {
		ref.current.focus();
		ref.current.select();
		document.execCommand('copy');
		//TODO notification copied!
	}

	return <div class="copy-box" onClick={handleClick}>
			<input ref={ref} type="text" value={text} readOnly/>
			<svg class="feather">
				<use xlinkHref={`/res/svgs/feather-sprite.svg#copy`}/>
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

function CreateDashboardModal({hide}) {
	const [title, setTitle] = useState('');

	const createDashboard = async e => {
		try {
			//TODO validate SERVER SIDE titleToSlug(title).length > 0
			const newDashboard = {
				title: title,
				background: null,
				checks: [],
				statics: []
			}

			const res = await meerkat.createDashboard(newDashboard);
			route(`/edit/${res.slug}`);
		} catch(e) {
			//TODO
			console.log("Failed to create modal")
			console.log(e)
		}
	}

	return <div class="modal-wrap" onMouseDown={hide}>
		<div class="modal" onMouseDown={e => e.stopPropagation()}>
			<h3>Create Dashboard</h3>

			<label for="title">Title</label>
			<input id="title" name="title" type="text" placeholder="New Dashboard"
				value={title} onInput={e => setTitle(e.currentTarget.value)} />

			<label>Result url</label>
			<CopyTextBox text={window.location.host + '/view/' + titleToSlug(title)} />

			<div class="right" style="margin-top: 20px">
				<button onClick={createDashboard}>Create</button>
			</div>
		</div>
	</div>
}

function DashboardList({dashboards, loadDashboards, filter}) {
	const deleteDashboard = slug => meerkat.deleteDashboard(slug).then(loadDashboards);

	if(dashboards === null) {
		return <div class="subtle loading">Loading Dashboards</div>
	}

	const filteredDashboards = dashboards.filter((dashboard) => {
		if(filter === '') {
			return true;
		} else {
			return dashboard.title.toLowerCase().includes(filter.toLowerCase());
		}
	})

	if(filteredDashboards.length < 1) {
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
			</div>
		</div>
	});

	return <Fragment>{dbs}</Fragment>
}

export function Home() {
	const [showModal, setShowModal] = useState(false);
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState('');

	const loadDashboards = () => meerkat.getAllDashboards().then(dbs => setDashboards(dbs));

	useEffect(loadDashboards, []);

	return <Fragment>
	<div class="home">
		<h1 class="title">Meerkat</h1>

		<div class="center" style="margin: 20px 0 40px;">
			<button onClick={e => setShowModal(true)}>Create New Dashboard</button>
		</div>

		<div class="filter-wrap">
			<input type="text" id="filter" onInput={e => setFilter(e.currentTarget.value)} placeholder="Filter dashboards" />
		</div>

		<div class="filter-results">
			<DashboardList loadDashboards={loadDashboards} dashboards={dashboards} filter={filter} />
		</div>
	</div>
	{showModal ? <CreateDashboardModal hide={() => setShowModal(false)} /> : null}
	</Fragment> 
}