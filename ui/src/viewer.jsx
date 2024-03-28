import { h, render, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

import * as meerkat from "./meerkat";
import * as icinga from "./icinga/icinga.js";
import { CheckSVG } from "./elements/svg";
import { CheckLine } from "./elements/line";
import { Video } from "./elements/video";
import { Clock } from "./elements/clock";
import { StaticText } from "./statics/text";
import { DynamicText } from "./elements/text";
import { StaticTicker } from "./statics/ticker";
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
			element.type == "check-line" ||
			element.type == "dynamic-text"
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
	const errorElement = () => {
		if (hasDuplicates(dashboard.order)) {
			return (
				<div id="error">
					<div class="alert alert-danger w-100 p-3 fixed-top" role="alert">
						<div style="width:100%">
							<strong>
								<a href={`/${dashboard.slug}/info`}>
									Inconsistent Severity Order: Check Severity Order and Save dashboard info to fix{" "}
								</a>
							</strong>
						</div>
					</div>
				</div>
			);
		} else {
			return <div id="error"></div>;
		}
	};

	if (dashboard.background && dashboard.background != "") {
		return (
			<div style="position: relative; width: 100%">
				<img src={dashboard.background} style="width: 100%; height: auto" />
				{elements}
				{errorElement()}
			</div>
		);
	}
	return (
		<div style="width: 100vh; height: 100vh">
			{elements}
			{errorElement()}
		</div>
	);
}

function IcingaElement({ typ, options, events, dashboard }) {
	let ele;
	if (typ === "check-svg") {
		ele = <CheckSVG events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "check-line") {
		ele = <CheckLine events={events} options={options} dashboard={dashboard} />;
	} else if (typ === "dynamic-text") {
		ele = <DynamicText events={events} options={options} />;
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
	if (typ === "static-ticker") {
		ele = <StaticTicker options={options} />;
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

const elems = window.location.pathname.split("/");
const slug = elems[elems.length - 2];

var reconnectFrequencySeconds = 5;
var evtSource;
var backendError = false;

var tryToSetupFunc = function () {
	setupEventSource();
	reconnectFrequencySeconds *= 2;
	if (reconnectFrequencySeconds >= 64) {
		reconnectFrequencySeconds = 64;
	}
};

const hasDuplicates = (order) => {
	let values = new Set();
	for (let key in order) {
		if (values.has(order[key])) {
			return true;
		}
		values.add(order[key]);
	}
	return false;
};

const errorMessage = (type) => {
	if (document.getElementById("error").innerHTML == "") {
		var err =
			'<div class="alert alert-danger w-100 p-3 fixed-top" role="alert"><div style="width:100%"><strong>Error connecting to ' +
			type +
			" server</strong></div></div>";
		document.getElementById("error").innerHTML = err;
	}
};

function setupEventSource() {
	evtSource = new EventSource("/events?stream=updates");
	evtSource.onmessage = function (e) {
		if (
			slug == e.data ||
			e.data == "update" ||
			(e.data == "icinga-success" && backendError) ||
			(e.data == "heartbeat" &&
				!backendError &&
				document.getElementById("error").innerHTML != "" &&
				!document.getElementById("error").innerHTML.includes("sort order"))
		) {
			evtSource.close();
			window.location.reload(true);
		} else if (e.data == "icinga-error") {
			if (!backendError) {
				errorMessage("backend");
				backendError = true;
			}
		}
	};
	evtSource.onopen = function () {
		reconnectFrequencySeconds = 5;
	};
	evtSource.onerror = function () {
		setTimeout(function () {
			errorMessage("meerkat");
		}, 5000);
		backendError = false;
		evtSource.close();
		setTimeout(tryToSetupFunc, reconnectFrequencySeconds * 1000);
	};
}

setupEventSource();

// Paths are of the form /my-dashboard/view
const events = new EventSource("/events?stream=" + slug);

meerkat.getDashboard(slug).then((d) => {
	render(
		<Viewer dashboard={d} events={events} />,
		document.getElementById("dashboard")
	);
});
