import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import videojs from 'video.js';
import * as meerkat from '../meerkat';


export function IframeVideoOptions({options, updateOptions}) {
  return <Fragment>
    <label for="src">Source</label>
    <input id="src" name="src" value={options.source}
      onInput={e => updateOptions({source: e.currentTarget.value})}>
    </input>
    <div>
      <button>Render</button>
    </div>
  </Fragment>
}

export function IframeVideo({options}, props) {
  const { videoSrc } = props;
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {   
    buildPlayer();
  }, []);

  const buildPlayer = () => {
    const player = videojs(playerRef.current, { 
      autoplay: true, 
      controls: true,
      muted: true,
      disableVideoPlayPauseClick: true,
      controlBar: {
        fullscreenToggle: false
      },
      sources: [{
        src: `${options.source}`,
        type: 'application/x-mpegURL',
      }, {
        src: `${options.source}`,
        type: 'audio/mp3'
      }] 
    }, () => {
      player.src(videoSrc);
    });
    return () => {
      player.dispose();
    };
  }

    return (
      <div>
        <div data-vjs-player>
          <video ref={playerRef} id="hls_stream" width="140" height="264" id='livestream' className="video-js vjs-16-9 vjs-big-play-centered" playsInline />
        </div> 
        <div class="move-button">Move</div>
      </div>
    )
};