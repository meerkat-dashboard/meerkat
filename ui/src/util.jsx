import { h, Fragment, createRef } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Combobox } from "react-widgets";

import * as meerkat from "./meerkat";

export function icingaResultCodeToCheckState(checkType, resultCode) {
	if (checkType === "service") {
		switch (resultCode) {
			case 0:
				return "ok";
			case 1:
				return "warning";
			case 2:
				return "critical";
			case 3:
				return "unknown";
		}
	} else if (checkType === "host") {
		switch (resultCode) {
			case 0:
				return "up";
			case 1:
				return "down";
		}
	}
	return "";
}

function sortHost(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function sortService(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

function sortHostGroups(a, b) {
	return a.hostName.toLowerCase() > b.hostName.toLowerCase() ? 1 : 0;
}

function sortServiceGroups(a, b) {
	return a.displayName.toLowerCase() > b.displayName.toLowerCase() ? 1 : 0;
}

export function IcingaCheckList({ currentCheckopts, updateOptions }) {
	const [typeOptions, setTypeOptions] = useState("");
	const [selection, setSelection] = useState(currentCheckopts.selection);

	const updateTypeOptions = async () => {
		if (!selection) {
			setTypeOptions("");
			return;
		}
		setTypeOptions(
			<Combobox placeholder="Loading..." busy value="" data={[]} />
		);
		let opts = null;
		let input = "";
		let value = "";

		if (currentCheckopts.selection == selection) {
			value = currentCheckopts.id;
		}

		if (selection === "hosts") {
			opts = [];
			let hosts = await meerkat.getIcingaHosts();
			hosts.sort(sortHost);
			for (const host of hosts) {
				opts.push({
					id: host.id,
					selection: "hosts",
					objectType: "host",
					filter: `host.name=="${host.id}"`,
				});
			}
		} else if (selection === "services") {
			opts = [];
			let services = await meerkat.getIcingaServices();
			services.sort(sortService);
			for (const service of services) {
				opts.push({
					id: service.id,
					selection: "services",
					objectType: "service",
					filter: `service.__name=="${service.id}"`,
				});
			}
		} else if (selection === "host-groups") {
			opts = [];
			let hostGroups = await meerkat.getIcingaHostGroups();
			hostGroups.sort(sortHostGroups);
			for (const hostGroup of hostGroups) {
				opts.push({
					id: hostGroup.id,
					selection: "host-groups",
					objectType: "host",
					filter: `"${hostGroup.id}" in host.groups`,
				});
			}
		} else if (selection === "service-groups") {
			opts = [];
			let serviceGroups = await meerkat.getIcingaServiceGroups();
			serviceGroups.sort(sortServiceGroups);
			for (const serviceGroup of serviceGroups) {
				opts.push({
					id: serviceGroup.id,
					selection: "service-groups",
					objectType: "service",
					filter: `"${serviceGroup.id}" in service.groups`,
				});
			}
		} else if (selection === "host-filter") {
			input = (
				<input
					class="form-control"
					id="host-filter"
					name="host_filter"
					value={currentCheckopts.filter}
					type="text"
					placeholder="host.foo == 42"
					onInput={(e) =>
						updateOptions({ filter: e.target.value, objectType: "host" })
					}
				/>
			);
		} else if (selection === "service-filter") {
			input = (
				<input
					class="form-control"
					id="service-filter"
					name="service_filter"
					value={currentCheckopts.filter}
					type="text"
					placeholder="service.foo == 42"
					onInput={(e) =>
						updateOptions({ filter: e.target.value, objectType: "service" })
					}
				/>
			);
		} else if (selection === "host-services") {
			opts = [];
			let hosts = await meerkat.getIcingaHosts();
			for (const host of hosts) {
				opts.push({
					id: host.id,
					selection: "host-services",
					objectType: "service",
					filter: `host.name=="${host.id}"`,
				});
			}
		}

		if (opts !== null) {
			input = (
				<Combobox
					filter="contains"
					placeholder="Choose away..."
					textField="id"
					valueField="id"
					defaultValue={value}
					data={opts}
					onSelect={updateOptions}
				/>
			);
		}

		if (input !== null) {
			setTypeOptions(input);
		}
	};

	useEffect(updateTypeOptions, [selection]);

	return (
		<fieldset>
			<label>Icinga object type</label>
			<select
				class="form-select"
				id="icinga-object-type-select"
				onInput={(sel) => setSelection(sel.currentTarget.value)}
				required
			>
				<ObjectTypeOptions selection={selection} />
			</select>
			{typeOptions}
		</fieldset>
	);
}

function ObjectTypeOptions({ selection }) {
	let types = [
		{ value: "hosts", label: "Hosts" },
		{ value: "services", label: "Services" },
		{ value: "host-groups", label: "Host Groups" },
		{ value: "service-groups", label: "Service Groups" },
		{ value: "host-filter", label: "Host Filter" },
		{ value: "service-filter", label: "Service Filter" },
		{ value: "host-services", label: "All Services on a Host" },
	];
	const options = types.map((t) => {
		if (t.value == selection) {
			return (
				<option key={t.value} value={t.value} selected>
					{t.label}
				</option>
			);
		}
		return (
			<option key={t.value} value={t.value}>
				{t.label}
			</option>
		);
	});
	return options;
}

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

export function IcingaHostVars({ optionsID, updateOptions, options }) {
	const [hosts, setHosts] = useState("");
	const [hostInfo, setHostInfo] = useState("");
	const [hostInfoKeys, setHostInfoKeys] = useState("");

	const searchHosts = async () => {
		setHosts(<Combobox placeholder="Loading..." busy value="" data={[]} />);

		let opts = null;
		let input = "";
		let input2 = "";
		let input3 = "";

		opts = [];

		let hosts = await meerkat.getIcingaHosts();
		hosts.sort(sortHost);

		for (const host of hosts) {
			opts.push({
				id: host.id,
				selection: "hosts",
				objectType: "host",
				filter: `host.name=="${host.id}"`,
			});
		}

		if (opts !== null) {
			input = (
				<Combobox
					filter="contains"
					placeholder="Choose away..."
					textField="id"
					valueField="id"
					defaultValue={optionsID}
					data={opts}
					onSelect={updateOptions}
				/>
			);
		}

		if (input !== null) {
			setHosts(input);
		}

		let hostInfo = await meerkat.getIcingaHostInfo(optionsID);
		let attrs = hostInfo.results[0].attrs;
		let hInfo = [];

		for (const [key, value] of Object.entries(attrs)) {
			hInfo.push({ id: key });
		}

		if (hInfo !== null) {
			input2 = (
				<Combobox
					filter="contains"
					placeholder="Choose away..."
					textField="id"
					valueField="id"
					defaultValue={options.dynamicText}
					data={hInfo}
					onSelect={(value) =>
						updateOptions({ dynamicText: value.id, dynamicText2: "" })
					}
				/>
			);
		}

		if (input2 !== null) {
			setHostInfo(input2);
		}

		let hInfo2 = [];

		if (
			attrs[options.dynamicText] &&
			(Array.isArray(attrs) || typeof attrs[options.dynamicText] === "object")
		) {
			updateOptions({ dynamicText2Structure: true });

			let flat = flattenObject(attrs[options.dynamicText]);

			for (const [key, value] of Object.entries(flat)) {
				hInfo2.push({ id: key });
			}

			if (hInfo2 !== null) {
				input3 = (
					<Combobox
						filter="contains"
						placeholder="Choose away..."
						textField="id"
						valueField="id"
						defaultValue={options.dynamicText2}
						data={hInfo2}
						onSelect={(value) => updateOptions({ dynamicText2: value.id })}
					/>
				);
			}
		} else {
			updateOptions({ dynamicText2Structure: false });
		}

		if (input3 !== null) {
			setHostInfoKeys(input3);
		}
	};

	useEffect(searchHosts, [optionsID, options.dynamicText]);

	return (
		<div>
			{hosts}
			<br />
			{hostInfo}
			<br />
			{hostInfoKeys}
		</div>
	);
}

export function dynamicTextHelper(attribute) {
	if (typeof attribute === "boolean") {
		if (attribute !== false) {
			attribute = "true";
		} else {
			attribute = "false";
		}
	} else if (typeof attribute === "number") {
		return attribute;
	} else if (!attribute) {
		attribute = "No Data";
	}

	return attribute;
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

export function linkHelper(element, ele, dashboard) {
	let link = element.options.linkURL;
	if (!link) {
		return ele;
	}
	return <a href={link}>{ele}</a>;
}
