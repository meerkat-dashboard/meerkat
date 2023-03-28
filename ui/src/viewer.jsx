import { h, render, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

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
			<div style="position: relative">
				<img src={dashboard.background} style="max-width: 100%; object-fit: scale-down;" />
				{elements}
			</div>
		);
	}
	return {elements};
}

function IcingaElement({ typ, options, events }) {
	// ObjectCards do not read from the event stream, but we put
	// them here under IcingaElement as they are more closely related
	// to Icinga than to the other elements like Clock or Video.
	if (typ == "check-card") {
		return (
			<ObjectCard
				objectType={options.objectType}
				objectName={options.objectName}
				fontSize={options.fontSize}
			/>
		);
	}

	let [objState, setObjState] = useState(3); // unknown

	let interests = options.objectName;
	if (options.objectType.endsWith("group")) {
		meerkat
			.getAllInGroup(options.objectName, options.objectType)
			.then((results) => {
				for (const v of results) {
					interests.push(v.name);
				}
			})
			.catch((err) => {
				console.error(
					`fetch ${options.objectType} ${options.objectName}: ${err}`
				);
			});
	} else if (options.objectType.endsWith("filter")) {
		meerkat
			.getAllFilter(options.objectName, options.objectType)
			.then((results) => {
				for (const v of results) {
					interests.push(v.name);
				}
			})
			.catch((err) => {
				console.error(
					`fetch ${options.objectType} ${options.objectName}: ${err}`
				);
			});
	}

	async function refresh() {
		try {
			const obj = await meerkat.getIcingaObject(
				options.objectName,
				options.objectType
			);
			setObjState(obj.attrs.state);
		} catch (err) {
			console.error(
				`fetch ${options.objectType} ${options.objectName}: ${err}`
			);
		}
	}

	useEffect(() => {
		refresh();
		events.addEventListener("message", (ev) => {
			if (interests.includes(ev.data)) {
				refresh();
			}
		});
	}, [interests]);

	let ele;
	if (typ === "check-svg") {
		ele = <CheckSVG state={objState} objType={options.objectType} />;
	} else if (typ === "check-line") {
		ele = <CheckLine state={objState} options={options} />;
	}

	if (options.linkURL) {
		return linkWrap(ele, options.linkURL);
	}
	return ele;
}

function DashElement({ typ, options }) {
	let [objState, setObjState] = useState(3); // unknown

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
