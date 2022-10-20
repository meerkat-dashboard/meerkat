# Meerkat

Meerkat is a utility to create and share dashboards for Icinga 2 checks and hosts. It is comprised of a lightweight Go server and a browser front-end written in Preact. It's quick to setup and easy to use.

**Not developing Meerkat?** See the Meerkat website at https://meerkat.run

## Development

First, build the frontend. Install dependencies, then build the application bundle:

	cd frontend
	npm install
	npm run build

Next, build the backend:

	cd ..
	go build

Finally, run meerkat and provide a configuration file:

	./meerkat -config config/meerkat.toml

Or on Windows

	cd ..
	.\meerkat.exe -config config\meerkat.toml

See `config/meerkat.toml.example` for an example configuration file.
For a full configuration reference, see [Configuration](https://meerkat.run/configuration) on the project website.

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
