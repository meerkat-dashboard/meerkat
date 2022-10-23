import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
// import hls.light.js rather than hls.js; no advanced client-side features required for monitoring.
import Hls from "hls.js/dist/hls.light.js";

export function IframeVideoOptions({ options, updateOptions }) {
	return (
		<Fragment>
			<label for="src">Source</label>
			<input
				class="form-control"
				id="src"
				name="src"
				value={options.source}
				onInput={(e) => updateOptions({ source: e.currentTarget.value })}
			></input>
		</Fragment>
	);
}

export function IframeVideo({ options }) {
	let videoRef = useRef(null);
	useEffect(() => {
		if (Hls.isSupported()) {
			const hls = new Hls({ enableWorker: false });
			hls.loadSource(options.source);
			hls.attachMedia(videoRef.current);
		}
		// otherwise we're running in a browser with native HLS support
	});
	return (
		<video
			style="width: 90%; height: 90%"
			ref={videoRef}
			src={options.source}
			controls
		></video>
	);
}
