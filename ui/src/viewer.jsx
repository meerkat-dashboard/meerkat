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
	useEffect(() => {
		new EventSource("/dashboard/stream").onmessage = (msg) => {
			if (dashboard.title == msg.data || msg.data == "update") {
				window.location.reload(true);
			}
		};
	});

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
					dashboard={dashboard}
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

function IcingaElement({ typ, options, events, dashboard }) {
	let ele;
	if (typ === "check-svg") {
		ele = <CheckSVG events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "check-line") {
		ele = <CheckLine events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "check-card") {
		ele = <ObjectCard events={events} options={options} dashboard={dashboard} />;
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
