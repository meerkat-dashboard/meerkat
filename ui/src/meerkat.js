async function fetchHandler(string) {
	if (navigator.onLine) {
		try {
			const res = await fetch(string);
			if (res.status !== 200) {
				return 3;
			}
			return res.json();
		} catch (e) {
			return false;
		}
	} else {
		return false;
	}
}

export async function getIcingaHosts() {
	const res = await fetch(`/icinga/hosts`);
	return res.json();
}

export async function getIcingaServices() {
	const res = await fetch(`/icinga/services`);
	return res.json();
}

export async function getIcingaHostGroups() {
	const res = await fetch(`/icinga/hostgroups`);
	return res.json();
}

export async function getIcingaServiceGroups() {
	const res = await fetch(`/icinga/servicegroups`);
	return res.json();
}

export async function getIcingaObjectState(objectType, filter) {
	return fetchHandler(
		`/icinga/check_state?object_type=${encodeURIComponent(
			objectType
		)}&filter=${encodeURIComponent(filter)}`
	);
}

export async function getCheckResult(
	objType,
	object,
	attrs = "last_check_result"
) {
	return fetchHandler(
		`/icinga/check_result?objtype=${objType}&object=${encodeURIComponent(
			object
		)}&attrs=${encodeURIComponent(attrs)}`
	);
}

export async function getDashboard(slug) {
	return fetchHandler(`/dashboard/${slug}`);
}

export async function getAllDashboards() {
	const res = await fetch("/dashboard");
	return res.json();
}

export async function saveDashboard(slug, dashboard) {
	await fetch(`/dashboard/${slug}`, {
		method: "POST",
		body: JSON.stringify(dashboard),
	});
}

export async function uploadFile(file) {
	const res = await fetch("/upload", {
		headers: {
			filename: file.name,
		},
		method: "POST",
		body: file,
	});
	const resp = await res.json();
	if (resp.error != "") {
		throw new Error(resp.error);
	}
	return resp;
}

export async function authConfigured() {
	const res = await fetch("/authentication", {
		method: "HEAD",
	});
	if (res.status == 204) {
		return true;
	}
	return false;
}

export async function authenticate() {
	return await fetch("/authenticate");
}
