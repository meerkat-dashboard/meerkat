import { h, Fragment, createRef, JSX } from 'preact';
import { RouterProps, route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import { Dashboard } from './editor';

function CopyTextBox({text}: {text: string}) {
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

const titleToSlug = (title: string): string => {
	let result = title;
	result.toLowerCase(); //convert upper case to lower case
	result = result.trim() //remove preceeding and trailing whitespace
	result = result.replace(/[_\s]/g, '-'); //convert spaces and underscores to dashes
	result = result.replace(/[^a-z0-9\-]/g, ''); //Remove any other characters

	return result;
}

function CreateDashboardModal(props: {hide: () => void}) {
	const [title, setTitle] = useState('');

	const createDashboard = async e => {
		try {
			//TODO validate SERVER SIDE titleToSlug(title).length > 0

			const newDashboard = {
				title: title,
				background: null,
				checks: []
			}

			const data = await fetch(`/dashboard`, {
				method: 'POST',
				body: JSON.stringify(newDashboard)
			}).then(res => res.json());

			route(`/edit/${data.slug}/settings`);
		} catch(e) {
			//TODO
			console.log("Failed to create modal")
			console.log(e)
		}
	}

	return <div class="modal-wrap" onClick={props.hide}>
		<div class="modal" onClick={e => e.stopPropagation()}>
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

function DashboardList(props: {dashboards: Array<Dashboard>, loadDashboards: () => void, filter: string}) {
	const deleteDashboard = (slug: string) => {
		fetch(`/dashboard/${slug}`, {
			method: 'DELETE'
		}).then(props.loadDashboards)
	}

	if(props.dashboards === null) {
		return <div class="subtle loading">Loading Dashboards</div>
	}

	const filteredDashboards = props.dashboards.filter((dashboard: Dashboard) => {
		if(props.filter === '') {
			return true;
		} else {
			return dashboard.title.toLowerCase().includes(props.filter.toLowerCase());
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
				<a onClick={e => route(`/edit/${slug}/settings`)}>edit</a>
				<a onClick={e => deleteDashboard(slug)}>delete</a>
			</div>
		</div>
	});

	return <Fragment>{dbs}</Fragment>
}

export function Home(props: RouterProps) {
	const [showModal, setShowModal] = useState(false);
	const [dashboards, setDashboards] = useState(null);
	const [filter, setFilter] = useState('');

	const loadDashboards = () => {
		fetch('/dashboard')
			.then(res => res.json())
			.then(dbs => setDashboards(dbs));
	}

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