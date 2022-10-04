# Operations

Meerkat is in use in real environments.

Meerkat is designed to be used in a trusted LAN.

## Authentication

By default, Meerkat has no authentication.
Dashboards are writeable by everyone who can view dashboards.

An *experimental* basic authentication feature is available.
It can be enabled by setting the `AdminUsername` and `AdminPassword` configuration options.
See [Configuration](configuration).

To authenticate, try to create and save a new dashboard.
The browser will prompt for authentication.

## Backups

Dashboards are stored on the filesystem as JSON files.
In a default installation, the path to dashboards is `/usr/local/meerkat/dashboards`.

The `dashboard-data` directory is for image/file data.
