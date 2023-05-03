---
title: Meerkat as a systemd service
parent: Tutorials
---

# Tutorial: Meerkat as a systemd service

Meerkat is intended to be run as a long-running process via a process manager like [systemd].
Meerkat is distributed with a suitable [service unit file].
This tutorial covers how to install that file and other required system configuration.

## Prerequisites

- **Installed Meerkat**. See [Installing Meerkat].
- **Permissions to edit system configuration**.
We are installing files in the `/etc` directory and changing file ownership.

## 1. Create a user

Create an underprivileged user "meerkat" that the service will run as:

	useradd -d /usr/local/meerkat -s /usr/sbin/nologin meerkat

Ensure that the meerkat directory is owned by the new user:

	chown -R meerkat /usr/local/meerkat/

## 2. Install `meerkat.service`

Copy the Meerkat unit file from the meerkat installation directory to the systemd service directory.
Assuming the default installation directory:

	cp /usr/local/meerkat/contrib/meerkat.service /etc/systemd/system/

Systemd needs to be made aware of the new service:

	systemctl daemon-reload

## 3. Install configuration

Meerkat will load its configuration from `/etc/meerkat.toml`.
Write a configuration file to this path if required.
For a config file reference see [Configuration].

Ensure the meerkat user can read the file:

	chown meerkat /etc/meerkat.toml

## 4. Enable and start Meerkat

To ensure Meerkat starts at system boot time, we can enable Meerkat:

	systemctl enable meerkat

To start meerkat:

	systemctl start meerkat

[systemd]: https://systemd.io
[service unit file]: https://www.freedesktop.org/software/systemd/man/systemd.service.html
[Installing Meerkat]: ../install
[Configuration]: ../configuration
