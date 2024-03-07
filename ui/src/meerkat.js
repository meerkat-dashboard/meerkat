import * as icinga from "./icinga/icinga.js";

export async function getAll(objectType) {
	objectType = pluralise(objectType);
	const resp = await fetch(
		`/api/all?type=${objectType}&title=${window.location.pathname}`
	);
	return await readResults(resp);
}

export async function getAllFilter(expr, objectType) {
	// %22example%22%20in%20service.groups
	const filter = encodeURIComponent(expr);
	let typ = "service";
	if (objectType.startsWith("host")) {
		typ = "host";
	}
	// /icinga/v1/objects/services?filter=%22example%22%20in%20service.groups
	const path = `/api/objects?type=${pluralise(typ)}`;
	const resp = await fetch(
		path + "&filter=" + filter + "&title=" + window.location.pathname
	);
	const results = await readResults(resp);
	return await handleJSONList(results);
}

export async function handleJSONList(obj) {
	let json = [{}];
	for (let i = 0; i < obj.length; i++) {
		json[i] = await handleJSON(obj[i]);
	}
	return json;
}

export async function getIcingaObject(name, typ) {
	if (typ.endsWith("filter")) {
		const results = await getAllFilter(name, typ);
		return icinga.objectsToSingle(name, results);
	}
	typ = pluralise(typ);
	let encname = encodeURIComponent(name);
	let path = `/api/objects?type=${typ}&name=${encname}&title=${window.location.pathname}`;
	const resp = await fetch(path);
	const results = await readResults(resp);
	let obj = results[0];
	if (typ.endsWith("groups")) {
		const members = await getAllFilter(name, typ);
		obj = icinga.groupToObject(obj, members);
	}
	return await handleJSON(obj);
}

export async function handleJSON(obj) {
	var json = {
		acknowledged: obj.attrs.acknowledgement,
		name: obj.attrs.__name,
		type: obj.attrs.type,
		output: obj.attrs.last_check_result.output,
		perfdata: {},
		state: obj.attrs.last_check_result.state,
		element: obj.element,
	};
	try {
		if (obj.attrs.last_check_result.performance_data) {
			for (
				let i = 0;
				i < obj.attrs.last_check_result.performance_data.length;
				i++
			) {
				var data = obj.attrs.last_check_result.performance_data[i];
				if (typeof data === "string") {
					var label = data.split("=")[0];
					var value = data.split("=")[1].split(";")[0];
					json.perfdata[label] = value;
				} else {
					json.perfdata[data.label] = data.value;
				}
			}
		} else {
			json.perfdata = {};
		}
	} catch (e) {
		console.log(obj.attrs.__name);
		console.log(obj.attrs.last_check_result.performance_data);
		console.log(e);
	}

	return json;
}

export async function getDashboard(slug) {
	const resp = await fetch(`/dashboard/${slug}`);
	if (!resp.ok) {
		throw new Error(resp.statusText);
	}
	return await resp.json();
}

export async function getSounds() {
	const resp = await fetch(`/file/sound`);
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
	await fetch(`/${slug}/update`, {
		method: "GET",
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
