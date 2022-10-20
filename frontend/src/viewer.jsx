import { h, render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { linkHelper } from "./util";

import * as meerkat from "./meerkat";
import { CheckCard } from "./elements/card";
import { CheckImage } from "./elements/image";
import { CheckSVG } from "./elements/svg";
import { CheckLine } from "./elements/line";
import { AudioStream } from "./elements/audio";
import { IframeVideo } from "./elements/video";
import { DynamicText } from "./elements/text";
import { Clock } from "./elements/clock";
import { StaticText } from "./statics/text";
import { StaticTicker } from "./statics/ticker";
import { StaticSVG } from "./statics/svg";
import { StaticImage } from "./statics/image";

function Viewer({ slug }) {
	let [dashboard, setDashboard] = useState(null);

	useEffect(() => {
		meerkat.getDashboard(slug).then((board) => setDashboard(board));
	}, [slug]);

	if (dashboard === null) {
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

		let ele;
		if (element.type === "check-card") {
			ele = (
				<CheckCard
					options={element.options}
					dashboard={dashboard}
					slug={slug}
				/>
			);
		}
		if (element.type === "clock") {
			ele = (
				<Clock
					timeZone={element.options.timeZone}
					fontSize={element.options.fontSize}
				/>
			);
		}
		if (element.type === "check-svg") {
			ele = (
				<CheckSVG options={element.options} dashboard={dashboard} slug={slug} />
			);
		}
		if (element.type === "check-image") {
			ele = (
				<CheckImage
					options={element.options}
					dashboard={dashboard}
					slug={slug}
				/>
			);
		}
		if (element.type === "check-line") {
			ele = (
				<CheckLine
					options={element.options}
					dashboard={dashboard}
					slug={slug}
				/>
			);
		}
		if (element.type === "static-text") {
			ele = <StaticText options={element.options} />;
		}
		if (element.type === "dynamic-text") {
			ele = <DynamicText options={element.options} />;
		}
		if (element.type === "static-ticker") {
			ele = <StaticTicker options={element.options} />;
		}
		if (element.type === "static-svg") {
			ele = <StaticSVG options={element.options} />;
		}
		if (element.type === "static-image") {
			ele = <StaticImage options={element.options} />;
		}
		if (element.type === "iframe-video") {
			ele = <IframeVideo options={element.options} />;
		}
		if (element.type === "audio-stream") {
			ele = <AudioStream options={element.options} />;
		}

		ele = linkHelper(element, ele, dashboard);

		if (element.type === "static-ticker") {
			return (
				<div
					class="view-ticker"
					style={{
						left: 0,
						top: top,
						width: "100vw",
						height: height,
						transform: rotation,
					}}
				>
					{ele}
				</div>
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

	const backgroundImage = dashboard.background ? dashboard.background : null;

	return (
		<div class="dashboard view-only">
			{backgroundImage ? (
				<img
					src={backgroundImage}
					class="noselect"
					style="height: 100%; width: 100%;"
					id="dashboard-dimensions"
				/>
			) : (
				<div class="noselect" style="height: 100vh; width: 100vw"></div>
			)}
			{elements}
		</div>
	);
}

// Paths are of the form /my-dashboard/view
const elems = window.location.pathname.split("/");
const slug = elems[elems.length - 2]
render(<Viewer slug={slug} />, document.body);
