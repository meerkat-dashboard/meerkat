//TODO error handling in here

export async function getIcingaHosts() {
	const res = await fetch(`/icinga/hosts`)
	return res.json();
}

export async function getIcingaServices() {
	const res = await fetch(`/icinga/services`)
	return res.json();
}

export async function getIcingaCheckState(checkId, checkType) {
	const res = await fetch(`/icinga/${checkType}s/${encodeURIComponent(checkId)}`);
	return res.json();
}

export async function getAllDashboards() {
	const res = await fetch('/dashboard')
	return res.json();
}

export async function getDashboard(slug) {
	const res = await fetch(`/dashboard/${slug}`);
	return res.json();
}

export async function createDashboard(dashboard) {
	const res = await fetch(`/dashboard`, {
		method: 'POST',
		body: JSON.stringify(dashboard)
	})
	
	return res.json();
}

export async function saveDashboard(slug, dashboard) {
	const res = await fetch(`/dashboard/${slug}`, {
		method: 'POST',
		body: JSON.stringify(dashboard)
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

