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
	const res = await fetch(`/icinga/v1/objects/hosts`);
	return res.json();
}

export async function getAll(objectType) {
	objectType = pluralise(objectType);
	const resp = await fetch(`/icinga/v1/objects/${objectType}?attrs=name`);
	let decoded = await resp.json();
	return decoded.results;
}

export async function getIcingaHostGroups() {
	const res = await fetch(`/icinga/hostgroups`);
	return res.json();
}

export async function getIcingaServiceGroups() {
	const res = await fetch(`/icinga/servicegroups`);
	return res.json();
}

export async function getIcingaObject(name, typ) {
	typ = pluralise(typ);
	name = encodeURIComponent(name);
	let path = `/icinga/v1/objects/${typ}/${name}`;
	const resp = await fetch(path);
	const decoded = await resp.json();
	if (!resp.ok) {
		if (decoded.status) {
			throw new Error(decoded.status);
		} else if (decoded.errors) {
			throw new Error(decoded.errors.join(", "));
		}
		throw new Error(`non-ok status from Icinga API: ${resp.statusText}`);
	}

	if (decoded.results.length == 0) {
		throw new Error("no such object");
	}
	return decoded.results[0];
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

export async function saveDashboard(slug, dashboard) {
	const resp = await fetch(`/dashboard/${slug}`, {
		method: "POST",
		body: JSON.stringify(dashboard),
	});
	if (!resp.ok) {
		throw new Error(await resp.text());
	}
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

function pluralise(str) {
	if (str.slice(-1) != "s") {
		return str + "s";
	}
}
