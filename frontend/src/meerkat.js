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

function filterReplace(filter, dashboard) {
	if (dashboard.hasOwnProperty('variables')) {
		for (const [key, value] of Object.entries(dashboard.variables)) {
			if (filter.includes(`~${key}~`)) {
				let reg = new RegExp('~(' + key + ')~', 'g');
				filter = filter.replaceAll(reg, value);
			}
		}
	}
	return filter;
}

export async function getIcingaObjectState(objectType, filter, dashboard) {
	let failed = 0;
	filter = filterReplace(filter, dashboard);
	const res = await fetch(`/icinga/check_state?object_type=${encodeURIComponent(objectType)};filter=${encodeURIComponent(filter)}`);

	if (res.status !== 200) {
		failed++;
		if (failed > 2) {
			window.flash(`This dashboard isn't updating`, 'error');
			return;
		}
		return 3;
	} else {
		failed = 0;
		return res.json();
	}
}

export async function getCheckResult(objType, object, attrs="last_check_result") {
	const res = await fetch(`/icinga/check_result?objtype=${objType};object=${encodeURIComponent(object)};attrs=${encodeURIComponent(attrs)}`);

	if (res.status !== 200) {
		return console.log("query unsuccesful");
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

export async function changeSettings(settings) {
	const settingsProcessed = {
		appName: settings
	};

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

