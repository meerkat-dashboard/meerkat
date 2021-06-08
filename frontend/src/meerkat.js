import { fetchHandler, filterReplace } from './util';

export async function getIcingaHosts() {
	const res = await fetch(`/icinga/hosts`)
	return res.json();
}

export async function getIcingaHostInfo(host) {
	const res = await fetch(`/icinga/dynamic_text/${encodeURIComponent(host)}`)
	return res.json();
}

export async function getIcingaServices() {
	const res = await fetch(`/icinga/services`)
	return res.json();
}

export async function getIcingaHostGroups() {
	const res = await fetch(`/icinga/hostgroups`);

	return res.json();
}

export async function getIcingaServiceGroups() {
	const res = await fetch(`/icinga/servicegroups`)
	return res.json();
}

export async function getIcingaObjectState(objectType, filter, dashboard) {
	return fetchHandler(`/icinga/check_state?object_type=${encodeURIComponent(objectType)};filter=${encodeURIComponent(filterReplace(filter, dashboard))}`);
}

export async function getCheckResult(objType, object, attrs="last_check_result") {
	return fetchHandler(`/icinga/check_result?objtype=${objType};object=${encodeURIComponent(object)};attrs=${encodeURIComponent(attrs)}`);
}

export async function getDashboard(slug) {
	return fetchHandler(`/dashboard/${slug}`);
}

export async function getAllDashboards() {
	const res = await fetch('/dashboard')
	const data = await res.json();

	return data;
}

export async function createDashboard(dashboard) {
	const res = await fetch(`/dashboard`, {
		method: 'POST',
		body: JSON.stringify(dashboard)
	})

	return res.json();
}

export async function changeSettings(settings) {
	const settingsProcessed = { appName: settings };

	const res = await fetch(`/settings`, {
		method: 'POST',
		body: JSON.stringify(settingsProcessed)
	})

	return res.json();
}

export async function getSettings() {
	const res = await fetch('/settings')
	const data = await res.json();

	return data;
}

export async function saveDashboard(slug, dashboard) {
	const res = await fetch(`/dashboard/${slug}`, {
		method: 'POST',
		body: JSON.stringify(dashboard)
	})
	return res.json();
}

export async function getTemplate(slug, params) {
	const res = await fetch(`/template?templateid=${slug}&${params}`, {
		method: 'GET',
	})
	return res.json();
}

export async function deleteDashboard(slug) {
	const res = await fetch(`/dashboard/${slug}`, {
		method: 'DELETE'
	})
	return res;
}

export async function uploadFile(file) {
	const res = await fetch('/upload', {
		headers: {
			"filename": file.name
		},
		method: 'POST',
		body: file
	});
	return res.json();
}

