# Configuration

Meerkat reads configuration from a text file in [TOML][toml] format.
By default meerkat reads from a file named `meerkat.toml` in the current working directory.
An alternative file may be specified with the `-config` flag.
For example:

	meerkat -config /etc/meerkat.toml

[toml]: https://toml.io

The following configuration options are available:

`HTTPAddr`: The address, in host:port format, to serve meerkat from. For example `0.0.0.0:6969`.
The default is ":8585" i.e. all IPv4, IPv6 addresses port 8585.

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

`CacheExpiryDurationSeconds`: number of seconds which meerkat will cache Icinga objects before requesting from the Icinga server again.
The default is 16 seconds.

`CacheSizeBytes`: Total size of the Icinga object cache in bytes.
If this size is reached, objects are evicted; oldest first.
The default is 20971520 (20MB).
