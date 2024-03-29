import { h, Component, createRef, Fragment } from "preact";
import * as fitty from "fitty";

export class Clock extends Component {
	constructor(props) {
		super(props);
		this.state = {
			time: Date.now(),
		};
		this.ref = createRef();
	}

	componentDidMount() {
		fitty.default(this.ref.current);
		this.timer = setInterval(() => {
			this.setState({ time: Date.now() });
		}, 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	render() {
		let t = new Intl.DateTimeFormat("en", {
			timeStyle: "medium",
			hourCycle: "h23",
			timeZone: this.props.timeZone,
		}).format(this.state.time);
		return (
			<time ref={this.ref} class="clock">
				{t}
			</time>
		);
	}
}

function TimezoneInput({ value, onChange }) {
	const timezones = Intl.supportedValuesOf("timeZone");
	return (
		<Fragment>
			<label class="form-label">Timezone</label>
			<select
				class="form-select"
				name="timeZone"
				value={value}
				onChange={onChange}
			>
				{timezones.map((tz, index) => (
					<option key={index} value={tz}>
						{tz}
					</option>
				))}
			</select>
		</Fragment>
	);
}

export class ClockOptions extends Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(event) {
		const target = event.target;
		this.props.onChange({
			[target.name]: target.value,
		});
	}

	render() {
		return (
			<form>
				<TimezoneInput
					value={this.props.timeZone}
					onChange={this.handleChange}
				/>
			</form>
		);
	}
}
