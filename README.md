# Meerkat

Meerkat is a utility to create and share dashboards for Icinga 2 checks and hosts. It is comprised of a lightweight Go server and a browser front-end written in Preact. It's quick to setup and easy to use.

**Not developing Meerkat?** See the Meerkat website at https://meerkat.run

## Development

Meerkat development requires supported releases of Go and Node.js.
See the [Go installation][goinstall] and [Node.js install][nodeinstall] documentation.
Devolopment with older toolchains may be ok but we can't guarantee the behaviour.

First, build the UI. Install dependencies, then build the application bundle:

	cd ui
	npm install
	npm run build

Next, build the backend:

	cd ../cmd/meerkat
	go build

Finally, run meerkat and provide a configuration file:

	./meerkat -config config/meerkat.toml

Or on Windows

	cd ..
	.\meerkat.exe -config config\meerkat.toml

See `config/meerkat.toml.example` for an example configuration file.
For a full configuration reference, see [Configuration](https://meerkat.run/configuration) on the project website.

[goinstall]: https://go.dev/doc/install
[nodeinstall]: https://nodejs.org/en/download/package-manager/

### Fast frontend development

By default, the meerkat command serves the UI from an embedded filesystem created at build time.
This means that changes to the UI are only served after rebuilding the entire command.
For convenience, we can instead serve the UI from the local OS' filesystem.
This way changes we make are served immediately by meerkat without rebuilding the program.
The meerkat command accepts the `-ui` flag, with a directory containing all the UI files.

A typical workflow is to start webpack which watches the filesystem and rebuilds on changes:

	cd ui
	npx run webpack --mode development --watch

Then run meerkat via `go run`:

	go run ./cmd/meerkat -ui ui/

## Configuring Icinga

Meerkat communicates with Icinga via its HTTP API.
This requires authentication.
Here is an example `ApiUser` object with limited, read-only privileges:

	object ApiUser "meerkat" {
		password = "meerkat"
		permissions = [ "objects/query/Host", "objects/query/Service", "objects/query/ServiceGroup", "objects/query/HostGroup" ]
	}

In a default Icinga2 installation, you can write this definition to `/etc/icinga2/conf.d/api-users.conf`.

### Support

Sol1 is an official Icinga Enterprise Partner, and can offer commercial support for Meerkat and Icinga and friends. We are a friendly bunch of people, so please don't hesitate to get in touch at https://sol1.com.au.

### Contributing
We welcome any contributions. Let us know via the issues here if there is something you need fixed up, or even better, a patch or PR would be most appreciated.

[Sounds from Notification Sounds](https://www.notificationsounds.com) provided under the creative commons 4.0 license

License is GNU Affero GPLv3.
