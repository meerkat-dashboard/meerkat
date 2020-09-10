import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import * as meerkat from '../meerkat';


export function AudioOptions({options, updateOptions}) {
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

export function AudioStream({options}, props) { 
    return (
        <div>
            <audio controls src={options.source} type="audio/mpeg"></audio>
        </div>
    );
}