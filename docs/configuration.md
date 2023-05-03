# Configuration

Meerkat reads configuration from a text file in [TOML] format.
By default meerkat reads from the path `/etc/meerkat.toml`.
An alternative file may be specified with the `-config` flag.
For example:

	meerkat -config /tmp/something/meerkat.toml

[TOML]: https://toml.io

The following configuration options are available:

`HTTPAddr`: The address, in host:port format, to serve meerkat from. For example `0.0.0.0:6969`.
The default is ":8080" i.e. all IPv4, IPv6 addresses port 8080.

`IcingaURL`: A URL pointing to an instance of Icinga serving the HTTP API.
Meerkat can connect to Icinga to create dashboard elements from Icinga objects.
This is usually a HTTPS URL with port 5665.
For example `https://icinga.example.com:5665`.
The default is using the loopback address and the default Icinga port `https://127.0.0.1:5665`.

`IcingaUsername`, `IcingaPassword`: The username and password with which to authenticate to Icinga.
The default value for both is `meerkat`.

`IcingaInsecureTLS`: If set to true, verification of the TLS certificates served by the Icinga API is skipped.
This is often required when Icinga is configured with self-signed certificates.
The default is false.

## Example

A typical installation is performed on the same host as Icinga.
Self-signed certificates are generally used,
and the password will *not* be `meerkat`.
So at `/etc/meerkat.toml`:

	IcingaPassword = "somethingsecret123456"
	IcingaInsecureTLS = true
