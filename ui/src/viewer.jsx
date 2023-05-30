import { h, render, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

import * as meerkat from "./meerkat";
import * as icinga from "./icinga/icinga.js";
import { CheckSVG } from "./elements/svg";
import { CheckLine } from "./elements/line";
import { Video } from "./elements/video";
import { Clock } from "./elements/clock";
import { StaticText } from "./statics/text";
import { StaticSVG } from "./statics/svg";
import { ObjectCard } from "./elements/i2object";

function Viewer({ dashboard, events }) {
	if (!dashboard.elements) {
		return;
	}

	const elements = dashboard.elements.map((element) => {
		const left = `${element.rect.x}%`;
		const top = `${element.rect.y}%`;
		const width = `${element.rect.w}%`;
		const height = `${element.rect.h}%`;
		const rotation = element.rotation
			? `rotate(${element.rotation}rad)`
			: `rotate(0rad)`;

		let ele = <DashElement typ={element.type} options={element.options} />;
		if (
			element.type == "check-card" ||
			element.type == "check-svg" ||
			element.type == "check-line"
		) {
			ele = (
				<IcingaElement
					typ={element.type}
					options={element.options}
					events={events}
				/>
			);
		}

		return (
			<div
				class="check"
				style={{
					left: left,
					top: top,
					width: width,
					height: height,
					transform: rotation,
				}}
			>
				{ele}
			</div>
		);
	});
	if (dashboard.background && dashboard.background != "") {
		return (
			<div style="position: relative; width: 100%">
				<img src={dashboard.background} style="width: 100%; height: auto" />
				{elements}
			</div>
		);
	}
	return <div style="width: 100vh; height: 100vh">{elements}</div>;
}

function IcingaElement({ typ, options, events }) {
	let [objState, setObjState] = useState(0);

	let interests = [];

	async function updateInterests() {
		if (options.objectType.endsWith("group")) {
			try {
				const results = await meerkat.getAllInGroup(
					options.objectName,
					options.objectType
				);
				let worst = icinga.worstObject(results);
				options.objectName = worst.name;
				options.objectType = worst.type;
				interests = [worst];
				refresh();
			} catch (err) {
				console.error(
					`fetch ${options.objectType} ${options.objectName}: ${err}`
				);
			}
		} else if (options.objectType.endsWith("filter")) {
			try {
				const results = await meerkat.getAllFilter(
					options.objectName,
					options.objectType
				);
				let worst = icinga.worstObject(results);
				options.objectName = worst.name;
				options.objectType = worst.type;
				interests = [worst];
				refresh();
			} catch (err) {
				console.error(
					`fetch ${options.objectType} ${options.objectName}: ${err}`
				);
			}
		} else {
			interests = [options.objectName];
		}
	}

	updateInterests();

	async function refresh() {
		try {
			const obj = await meerkat.getIcingaObject(
				options.objectName,
				options.objectType
			);
			setObjState(obj);
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	}

	useEffect(() => {
		refresh();
		if (typ === "check-card" && options.objectAttr !== undefined) {
			events.addEventListener("CheckResult", (ev) => {
				if (interests.includes(ev.data)) {
					refresh();
				}
			});
		} else {
			events.addEventListener("StateChange", (ev) => {
				if (interests.includes(ev.data)) {
					refresh();
				}
			});
		}
	}, []);

	let ele;
	if (typ === "check-svg") {
		ele = <CheckSVG state={objState.state} objType={options.objectType} />;
	} else if (typ === "check-line") {
		ele = <CheckLine state={objState.state} options={options} />;
	} else if (typ === "check-card") {
		ele = (
			<ObjectCard
				state={objState}
				objectType={options.objectType}
				objectName={options.objectName}
				objectAttr={options.objectAttr}
				objectAttrMatch={options.objectAttrMatch}
				objectAttrNoMatch={options.objectAttrNoMatch}
				fontSize={options.fontSize}
			/>
		);
	}

	if (options.linkURL) {
		return linkWrap(ele, options.linkURL);
	}
	return ele;
}

function DashElement({ typ, options }) {
	let ele;
	if (typ === "clock") {
		ele = <Clock timeZone={options.timeZone} fontSize={options.fontSize} />;
	}
	if (typ === "static-text") {
		ele = <StaticText options={options} />;
	}
	if (typ === "static-svg") {
		ele = <StaticSVG options={options} />;
	}
	if (typ === "image") {
		ele = <img src={options.image} />;
	}
	if (typ === "video") {
		ele = <Video src={options.source} />;
	}
	if (typ === "audio") {
		ele = <audio controls src={options.audioSource}></audio>;
	}

	if (options.linkURL) {
		return linkWrap(ele, options.linkURL);
	}
	return ele;
}

function linkWrap(ele, link) {
	return <a href={link}>{ele}</a>;
}

// Paths are of the form /my-dashboard/view
const elems = window.location.pathname.split("/");
const slug = elems[elems.length - 2];
const events = new EventSource("/icinga/stream");
meerkat.getDashboard(slug).then((d) => {
	render(
		<Viewer dashboard={d} events={events} />,
		document.getElementById("dashboard")
	);
});
