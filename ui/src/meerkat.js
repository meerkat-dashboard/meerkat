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
	return await readResults(resp);
}

export async function getAllInGroup(name, objectType) {
	// "example" in service.groups
	const expr = `"${name}" in ${objectType}.groups`;
	// %22example%22%20in%20service.groups
	const filter = encodeURIComponent(expr);
	// /icinga/v1/objects/services?filter=%22example%22%20in%20service.groups
	const path = `/icinga/v1/objects/${pluralise(objectType)}`;

	const resp = await fetch(path+"?filter="+filter);
	const results = await readResults(resp);
	return results;
}

export async function getIcingaObject(name, typ) {
	typ = pluralise(typ);
	name = encodeURIComponent(name);
	let path = `/icinga/v1/objects/${typ}/${name}`;
	const resp = await fetch(path);
	const results = await readResults(resp);
	return results[0];
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

function pluralise(str) {
	if (str.slice(-1) != "s") {
		return str + "s";
	}
}

/**
 * readResults decodes and returns the results from resp.
 * It throws on any error present in resp, or if there are no results.
 */
async function readResults(resp) {
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
		throw new Error("no objects");
	}
	return decoded.results;
}
