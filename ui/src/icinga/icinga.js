import { useRef, useEffect } from "preact/hooks";

// DefaultCheckInterval is the default duration, in milliseconds,
// which a standard Icinga installation will execute check commands if

// none is set explicitly.
const DefaultCheckInterval = 60 * 1000;

export function StateText(state, objectType) {
	if (!objectType) {
		return "unknown";
	}
	if (objectType.toLowerCase().includes("host")) {
		if (state == 0 || state == 1) {
			return "ok";
		} else if (state == 2 || state == 3) {
			return "critical";
		} else {
			return "unknown";
		}
	}

	switch (state) {
		case 0:
			return "ok";
		case 1:
			return "warning";
		case 2:
			return "critical";
		default:
			return "unknown";
	}
}

// NextRefresh returns an estimated duration until the Icinga HTTP API
// may be queried to detect a change of object state. Date should be the
// date when Icinga will perform its next check (see the next_check field
// from the API).
//
// Lag is the estimated proportion of the duration until the next check
// to when Icinga updates the object's state.
// Lag accounts for durations such as check command execution time.
// For example, if the next check is 60 seconds away and lag is set to 0.2,
// the estimated duration returned would be 72 seconds.
// If unset, the default lag is 10% (0.1) of the duration until the next check.
//
// If the next check is in the past (e.g. when objects have been
// unreachable from Icinga for some time), DefaultCheckInterval is
// returned.
export function NextRefresh(date, lag = 0.1) {
	let dur = until(date) + lag * until(date);
	if (dur < 0) {
		return DefaultCheckInterval;
	}
	return dur;
}

function until(date) {
	return date - new Date();
}

export function groupToObject(group, member) {
	let members = [{}];
	for (let i = 0; i < member.length; i++) {
		var object = {
			name: member[i].attrs.__name,
			state: member[i].attrs.last_check_result.state,
		};

		members[i] = object;
	}

	let o = group;
	o.attrs.state = worstState(members);
	o.source = {};
	for (let i = 0; i < members.length; i++) {
		// Dots are often used in object names; escape for ./flatten.js later.
		let name = escapeDots(members[i].name);
		o.source[name] = members[i];
	}
	return o;
}

function escapeDots(s) {
	return s.replaceAll(".", "-");
}

export function objectsToSingle(name, objects) {
	let obj = {
		name: name,
		attrs: {
			state: worstState(objects),
		},
		source: {},
	};
	for (let i = 0; i < objects.length; i++) {
		// Dots are often used in object names; escape for ./flatten.js later.
		let name = escapeDots(objects[i].name);
		obj.source[name] = objects[i];
	}
	return obj;
}

export function worstState(objects) {
	let worst = 0;
	for (let i = 0; i < objects.length; i++) {
		if (objects[i].state > worst) {
			worst = objects[i].state;
		}
	}
	return worst;
}

export function worstObject(objects) {
	let worst = objects[0];
	for (let i = 0; i < objects.length; i++) {
		if (objects[i].state > worst.state) {
			worst = objects[i];
		}
	}
	return worst;
}

let okAudio;
let warningAudio;
let criticalAudio;
let unknownAudio;
let upAudio;
let downAudio;

export function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}

export function alertSounds(checkState, options, dashboard) {
	checkState = StateText(checkState, options.objectType);
	const prevState = usePrevious(checkState);
	if (
		checkState !== undefined &&
		prevState !== undefined &&
		checkState !== prevState
	) {
		console.log(checkState, prevState);
		let audio;
		let soundOption;
		let prevSound;
		let prevDashboardSound;

		switch (checkState) {
			case "ok":
				audio = okAudio;
				soundOption = options.okSound || dashboard.okSound;
				prevSound = usePrevious(options.okSound);
				prevDashboardSound = usePrevious(dashboard.okSound);
				break;
			case "warning":
				audio = warningAudio;
				soundOption = options.warningSound || dashboard.warningSound;
				prevSound = usePrevious(options.warningSound);
				prevDashboardSound = usePrevious(dashboard.warningSound);
				break;
			case "critical":
				audio = criticalAudio;
				soundOption = options.criticalSound || dashboard.criticalSound;
				prevSound = usePrevious(options.criticalSound);
				prevDashboardSound = usePrevious(dashboard.criticalSound);
				break;
			case "unknown":
				audio = unknownAudio;
				soundOption = options.unknownSound || dashboard.unknownSound;
				prevSound = usePrevious(options.unknownSound);
				prevDashboardSound = usePrevious(dashboard.unknownSound);
				break;
			case "up":
				audio = upAudio;
				soundOption = options.upSound || dashboard.upSound;
				prevSound = usePrevious(options.upSound);
				prevDashboardSound = usePrevious(dashboard.upSound);
				break;
			case "down":
				audio = downAudio;
				soundOption = options.downSound || dashboard.downSound;
				prevSound = usePrevious(options.downSound);
				prevDashboardSound = usePrevious(dashboard.downSound);
				break;
			default:
				break;
		}

		if (
			audio === undefined ||
			soundOption !== prevSound ||
			soundOption !== prevDashboardSound
		) {
			audio = new Audio(soundOption);
		}

		if (!dashboard.globalMute && !options.muteAlerts && audio !== null) {
			audio.play();
		}
	}
}
