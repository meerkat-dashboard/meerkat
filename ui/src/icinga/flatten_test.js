import * as fs from "node:fs";
import test from "node:test";

import * as flatten from "./flatten.js";

test("select expressions", () => {
	const tests = [
		{
			expr: "state",
			want: 0,
		},
		{
			expr: "perfdata.label",
			want: "slave_lag",
		},
	];

	let v = JSON.parse(fs.readFileSync("src/icinga/kakoon_members.json"));
	let obj = v.results[0];
	for (let tt of tests) {
		let got = flatten.selectByExpr(tt.expr, obj);
		if (tt.want != got) {
			throw new Error(`select ${tt.expr}: want ${tt.want}, got ${got}`);
		}
	}

	const bad = ["", ".", "....", ".hello", "undefined."];
	for (let expr of bad) {
		let got;
		try {
			got = flatten.selectByExpr(expr, obj);
		} catch {
			// we wanted it to throw, so continue to next expression.
			continue;
		}
		throw new Error(`select "${expr}": no error, got ${got}`);
	}
});
