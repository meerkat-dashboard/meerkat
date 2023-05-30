// DefaultCheckInterval is the default duration, in milliseconds,
// which a standard Icinga installation will execute check commands if

// none is set explicitly.
const DefaultCheckInterval = 60 * 1000;

export function StateText(state, objectType) {
	if (!objectType) {
		return "unknown";
	}
	if (objectType.toLowerCase() == "host") {
		switch (state) {
			case 0:
				return "ok";
			case 1:
				return "critical";
			default:
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

export function groupToObject(group, members) {
	let o = group;
	o.attrs.next_check = soonestCheck(members);
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
			next_check: soonestCheck(objects),
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

// soonestCheck returns the Unix timestamp of the next check to be scheduled by Icinga from objects.
// A timestamp is used instead of a native Date type to maintain precision beyond milliseconds
// for consistency with Icinga.
function soonestCheck(objects) {
	let soonest = 0;
	for (const obj of objects) {
		const t = obj.attrs.next_check;
		if (soonest - t < 0) {
			soonest = t;
		}
	}
	return soonest;
}

export function worstState(objects) {
	let worst = 0;
	for (let i = 0; i < objects.length; i++) {
		if (objects[i].state > worst.state) {
			worst = objects[i];
		}
	}
	return worst.state;
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
