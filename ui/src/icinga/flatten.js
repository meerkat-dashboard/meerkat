/*
 * flatten provides utility functions for accessing values of objects
 * with select expressions.
 * For example, given the following object:
 *
 * 	const val = { person: { name: "Oliver", coolness: "max" } }
 *
 * Then accessing coolness can be done via:
 *
 * 	selectByExpr("person.coolness", val)
 *
 */

/*
 * selectExpressions returns an arrray of expressions for each property of obj.
 */
export function selectExpressions(expressions, obj, path = []) {
	for (const [k, v] of Object.entries(obj)) {
		if (v == null) {
			continue;
		}

		let expr = [...path, k].join(".");
		if (typeof v != "object") {
			// We have a string, number, or boolean.
			expressions.push(expr);
			continue;
		}

		// An array is an object but we don't want to recurse into arrays.
		// Instead, loop through each element and try
		// recursing into any elements which are objects.
		if (Array.isArray(v)) {
			for (const vv of v) {
				if (typeof vv == "object") {
					selectExpressions(expressions, vv, [...path, k]);
					continue;
				}
				// Otherwise we have a string, number or boolean.
				expressions.push(expr);
			}
		}

		// We've got an object. Down we go...
		selectExpressions(expressions, v, [...path, k]);
	}
	return expressions;
}

/*
 * selectByExpr returns the value of obj by evaluating the select expression expr.
 * It throws if there is no value for the expression.
 */
export function selectByExpr(expr, obj) {
	let v = expr.split(".").reduce((o, i) => o[i], obj);
	if (v == undefined) {
		throw new Error(`${expr} selects undefined value`);
	}
	return v;
}
