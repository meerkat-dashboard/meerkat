import * as fs from "node:fs";
import test from "node:test";

import * as Icinga from "./icinga.js";

test("group to object", (t) => {
	const tests = [{
		group: "src/icinga/kakoon.json",
		members: "src/icinga/kakoon_members.json",
		state: 2,
		next_check: 1676862152.143776,
	}];
	for (let tt of tests) {
		let group = JSON.parse(fs.readFileSync(tt.group)).results[0];
		let members = JSON.parse(fs.readFileSync(tt.members)).results;
		const obj = Icinga.groupToObject(group, members);
		if (obj.attrs.state != tt.state) {
			throw new Error(`want state ${tt.state}, got ${obj.attrs.state}`);
		}
		if (obj.attrs.next_check != tt.next_check) {
			throw new Error(`want soonest check ${tt.next_check}, got ${obj.attrs.next_check}`);
		}
	}
});
