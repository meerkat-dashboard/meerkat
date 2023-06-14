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
		const video = videoRef.current;
		if (Hls.isSupported()) {
			var hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				video.play();
			});
		} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = src;
			video.addEventListener("loadedmetadata", function () {
				video.play();
			});
		}
	}, []);
	return (
		<div>
			<video
				style="width: 90%; height: 90%"
				ref={videoRef}
				src={src}
				controls
				autoplay
				muted
			></video>
		</div>
	);
}
