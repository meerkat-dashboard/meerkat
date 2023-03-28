import * as icinga from "./icinga/icinga.js";

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
	const typ = singular(objectType);
	const expr = `"${name}" in ${typ}.groups`;
	return getAllFilter(expr, objectType);
}

export async function getAllFilter(expr, objectType) {
	// %22example%22%20in%20service.groups
	const filter = encodeURIComponent(expr);
	let typ = "service";
	if (objectType.startsWith("host")) {
		typ = "host";
	}
	// /icinga/v1/objects/services?filter=%22example%22%20in%20service.groups
	const path = `/icinga/v1/objects/${pluralise(typ)}`;
	const resp = await fetch(path + "?filter=" + filter);
	const results = await readResults(resp);
	return results;
}

export async function getIcingaObject(name, typ) {
	if (typ.endsWith("filter")) {
		const results = await getAllFilter(name, typ);
		return icinga.objectsToSingle(name, results);
	}
	typ = pluralise(typ);
	let encname = encodeURIComponent(name);
	let path = `/icinga/v1/objects/${typ}/${encname}`;
	const resp = await fetch(path);
	const results = await readResults(resp);
	let obj = results[0];
	if (typ.endsWith("groups")) {
		const members = await getAllInGroup(name, typ);
		obj = icinga.groupToObject(obj, members);
	}
	return obj;
}

export async function getDashboard(slug) {
	const resp = await fetch(`/dashboard/${slug}`);
	if (!resp.ok) {
		throw new Error(resp.statusText);
	}
	return await resp.json();
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
	return str;
}

function singular(objType) {
	if (objType == "servicegroups" || objType == "servicegroup") {
		return "service";
	}
	if (objType == "hostgroups" || objType == "hostgroup") {
		return "host";
	}
	throw new Error(`no single form of object type ${objType}`);
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
