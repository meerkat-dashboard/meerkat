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

export function Video({ src }) {
	const videoRef = useRef(null);
	if (!src) {
		return null;
	}
	// Only load hls.js in browsers that don't support it natively.
	useEffect(() => {
		if (Hls.isSupported() && src.endsWith("m3u8")) {
			const hls = new Hls({ enableWorker: false });
			hls.loadSource(src);
			hls.attachMedia(videoRef.current);
		}
	}, [src]);
	return (
		<video
			style="width: 90%; height: 90%"
			ref={videoRef}
			key={src}
			src={src}
			controls
			autoplay
		></video>
	);
}
