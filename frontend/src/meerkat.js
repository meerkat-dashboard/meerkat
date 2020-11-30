//TODO error handling in here

export async function getIcingaHosts() {
	const res = await fetch(`/icinga/hosts`)
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

export async function getIcingaObjectState(objectType, filter) {
	const res = await fetch(`/icinga/check_state?object_type=${encodeURIComponent(objectType)};filter=${encodeURIComponent(filter)}`);
	if (res.status !== 200) {
		return 3;
	} else {
		return res.json();
	}
}

export async function getCheckResult(objType, object, attrs="last_check_result") {
	const res = await fetch(`/icinga/check_result?objtype=${objType};object=${encodeURIComponent(object)};attrs=${encodeURIComponent(attrs)}`);

	if (res.status !== 200) {
		return console.log("query succesful");
	} else {
		return res.json();
	}
}

export async function getAllDashboards() {
	const res = await fetch('/dashboard')
	const data = await res.json();

	return data;
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

