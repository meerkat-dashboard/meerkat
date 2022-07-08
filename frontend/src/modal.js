import { h, Component } from "preact";

class Modal extends Component {
	render() {
		if (!this.props.show) {
			return null;
		}

		return <div id="modal-element">{this.props.children}</div>;
	}
}

export { Modal };
