import * as meerkat from "./meerkat";

export function flattenObject(obj, prefix = false, result = null) {
	result = result || {};

	if (
		prefix &&
		typeof obj === "object" &&
		obj !== null &&
		Object.keys(obj).length === 0
	) {
		result[prefix] = Array.isArray(obj) ? [] : {};
		return result;
	}

	prefix = prefix ? prefix + "." : "";

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			if (typeof obj[key] === "object" && obj[key] !== null) {
				flattenObject(obj[key], prefix + key, result);
			} else {
				result[prefix + key] = obj[key];
			}
		}
	}
	return result;
}

// get check data: performance and plugin output
// then invoke callback to propagate state
export function getCheckData(options, callback) {
	meerkat.getCheckResult(options.objectType, options.id).then((c) => {
		const checkData = {
			performance: null,
			pluginOutput: null,
		};

		// extract & transform performance data
		let perfData = c.results
			? c.results[0].attrs.last_check_result.performance_data
			: null;
		if (
			perfData !== null &&
			typeof perfData !== "undefined" &&
			perfData.length > 0
		) {
			let arrPerf = [];
			for (var i = 0; i < perfData.length; i++) {
				if (perfData[i].includes("=")) {
					arrPerf.push(perfData[i].split(";")[0]);
				}
			}
			checkData.performance = Object.fromEntries(
				arrPerf.map((s) => s.split("="))
			);
		}

		checkData.pluginOutput = c.results
			? c.results[0].attrs.last_check_result.output
			: null;

		callback(checkData);
	});
}
