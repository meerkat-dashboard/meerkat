---
title: Connecting Icinga
parent: Tutorials
---

# Tutorial: Connecting Icinga

Meerkat can connect to Icinga2 to create dashboards from Icinga2 objects like Services and Host Groups.
Meerkat uses the Icinga2 HTTP API.

## Prerequisites

- **An Icinga2 Server with the HTTP API set up**
- **Network connectivity between Meerkat and Icinga**. Meerkat must be able to initiate a connection to the Icinga server. The Icinga API is usually served on TCP port 5665.
- **Permissions to edit the Icinga configuration files**. We will be creating a user to access Icinga's API.
- **Permissions to edit the Meerkat configuration file**. The new user will be added.

## 1. Create a `ApiUser` object for Meerkat

Create an [ApiUser][apiuser] object with read-only privileges.
In a default installation, this configuration may be written to the file `/etc/icinga2/conf.d/api-users.conf`.
We will use the example username and password "meerkat".

	object ApiUser "meerkat" {
		password = "meerkat"
		permissions = [ "objects/query/Host", "objects/query/Service", "objects/query/ServiceGroup", "objects/query/HostGroup", "events/StateChange" , "events/CheckResult", "status/query" ]
	}

[apiuser]: https://icinga.com/docs/icinga-2/latest/doc/09-object-types/#apiuser

Reload the Icinga daemon. On Linux systems using systemd, this can be done with:

	systemctl restart icinga2

## 2. Add the new user to Meerkat

Set the Icinga URL and the username and password we just created in Meerkat's configuration file:

	IcingaURL = "https://icinga.example.com:5665"
	IcingaUsername = "meerkat"
	IcingaPassword = "meerkat"

If the Icinga instance uses self-signed certificates, set `IcingaInsecureTLS`:

	IcingaInsecureTLS = true

Restart Meerkat to reload its configuration file. On Linux systems using systemd:

	systemctl restart meerkat

## 3. Test creating Icinga dashboard elements

Browse to the URL serving Meerkat.

Choose a dashboard (or create a new one).

Click "add element" then select "Icinga Service" from the dropdown box.

See the [demo Meerkat](https://demo.meerkat.run) and the [screenshots](/) for inspiration on creating dashboards with Icinga elements.

More advanced usage of the Icinga elements,
such as rendering check result output, filtered with regular expressions,
are yet to be documented!
