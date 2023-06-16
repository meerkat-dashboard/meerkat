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
	const [error, setError] = useState("");

	var reconnectFrequencySeconds = 1;
	var evtSource;

	var waitFunc = function () {
		return reconnectFrequencySeconds * 1000;
	};
	var tryToSetupFunc = function () {
		setupEventSource();
		reconnectFrequencySeconds *= 2;
		if (reconnectFrequencySeconds >= 32) {
			reconnectFrequencySeconds = 32;
		}
	};

	function setupEventSource() {
		evtSource = new EventSource("/dashboard/stream");
		evtSource.onmessage = function (e) {
			if (dashboard.slug == e.data || e.data == "update" || error !== "") {
				window.location.reload(true);
			}
			if (e.data == dashboard.slug + "|error") {
				errorMessage("backend");
			}
		};
		evtSource.onopen = function () {
			reconnectFrequencySeconds = 1;
		};
		evtSource.onerror = function () {
			setTimeout(errorMessage("meerkat"), 1000);
			evtSource.close();
			setTimeout(tryToSetupFunc, waitFunc());
		};
	}

	setupEventSource();

	if (!dashboard.elements) {
		return;
	}

	const errorMessage = (type) => {
		if (error === "") {
			err = (
				<div class="alert alert-danger w-100 p-3" role="alert">
					<div style="width:100%">
						<strong>Error connecting to {type} server</strong>
					</div>
				</div>
			);
			setError(err);
		}
	};

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
				{error}
			</div>
		);
	}
	return (
		<div style="width: 100vh; height: 100vh">
			{elements}
			{error}
		</div>
	);
}

function IcingaElement({ typ, options, events, dashboard }) {
	let ele;
	if (typ === "check-svg") {
		ele = <CheckSVG events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "check-line") {
		ele = <CheckLine events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "check-card") {
		ele = (
			<ObjectCard events={events} options={options} dashboard={dashboard} />
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
