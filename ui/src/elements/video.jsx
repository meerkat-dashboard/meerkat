import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Hls from "hls.js/dist/hls.js";

export function VideoOptions({ options, updateOptions }) {
	return (
		<fieldset>
			<label for="src">Source</label>
			<input
				class="form-control"
				id="src"
				name="src"
				type="url"
				placeholder="http://v.example.com/stream.m3u8"
				value={options.source}
				onInput={(e) => updateOptions({ source: e.currentTarget.value })}
			></input>
			<small class="form-text">
				HLS stream URLs can be loaded with a <code>m3u8</code> file extension.
			</small>
		</fieldset>
	);
}

export function Video({ options }) {
	let videoRef = useRef(null);
	if (!options.source) {
		return null;
	}
	useEffect(() => {
		if (Hls.isSupported() && options.source.endsWith("m3u8")) {
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
			autoplay
		></video>
	);
}
