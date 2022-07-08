import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import bus from "../utils/bus";

export const Flash = () => {
	let [visibility, setVisibility] = useState(false);
	let [message, setMessage] = useState("");
	let [type, setType] = useState("");

	useEffect(() => {
		bus.addListener("flash", ({ message, type }) => {
			setVisibility(true);
			setMessage(message);
			setType(type);
			setTimeout(() => {
				setVisibility(false);
			}, 4000);
		});
	}, []);

	const alert = {
		color: "white",
		background: "#ff4a4a",
		borderRadius: "5px",
		position: "absolute",
		top: "40px",
		right: "30px",
		paddingTop: "38px",
		paddingBottom: "25px",
		paddingLeft: "40px",
		paddingRight: "40px",
		display: "flex",
		alignItems: "center",
		marginTop: "20px",
		zIndex: 2,
		margin: 0,
		fontSize: "20px",
	};

	const close = {
		color: "white",
		cursor: "pointer",
		marginLeft: "30px",
		marginRight: "5px",
		marginBottom: "14px",
	};

	// const error = {
	//     background: 'red',
	// }

	// const success = {
	//     background: 'lightgreen',
	// }

	useEffect(() => {
		if (document.getElementById("close") !== null) {
			document
				.getElementById("close")
				.addEventListener("click", () => setVisibility(false));
		}
	});

	return (
		visibility && (
			<div style={alert}>
				<p>{message}</p>
				<span style={close} id="close">
					<strong>X</strong>
				</span>
			</div>
		)
	);
};
