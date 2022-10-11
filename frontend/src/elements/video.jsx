import { h, Fragment, render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import videojs from "video.js";
import * as meerkat from "../meerkat";

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

export function IframeVideo({ options }, props) {
	const { videoSrc } = props;
	const playerRef = useRef(null);
	const [source, setPlaying] = useState("");

	useEffect(() => {
		buildPlayer();
	}, []);

	const noDefaultBehavior = (e) => {
		e.preventDefault();
		e.target.removeEventListener("mouseover", true);
	};

	const buildPlayer = () => {
		const player = videojs(
			playerRef.current,
			{
				autoplay: true,
				controls: true,
				muted: true,
				disableVideoPlayPauseClick: true,
				controlBar: {
					fullscreenToggle: false,
				},
				sources: [
					{
						src: `${options.source}`,
						type: "application/x-mpegURL",
					},
					{
						src: `${options.source}`,
						type: "audio/mp3",
					},
				],
			},
			() => {
				player.src(videoSrc);
			}
		);
		return () => {
			player.dispose();
		};
	};

	return (
		<div class="video-overlay">
			<div data-vjs-player>
				<video-js
					onClick={noDefaultBehavior}
					ref={playerRef}
					id="livestream"
					style="pointer-events: none"
					className="video-js vjs-16-9 vjs-big-play-centered video-player"
					playsInline
				>
					<source src={options.source} type="application/x-mpegURL" />
				</video-js>
			</div>
		</div>
	);
}
