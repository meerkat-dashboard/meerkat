# Configuration

Meerkat reads configuration from a text file in [TOML](https://toml.io) format. By default meerkat reads from the path `/etc/meerkat.toml`. An alternative file may be specified with the `-config` flag.
For example:
```
meerkat -config /tmp/something/meerkat.toml
```

The following configuration options are available:

**HTTPAddr**

The address, in host:port format, to serve meerkat from. For example 0.0.0.0:8080. 
The default is “:8080” i.e. all IPv4, IPv6 addresses port 8080.
```
HTTPAddr = "0.0.0.0:8080"
```

**Icinga**
The URL for an instance of Icinga serving the Icinga API
```
IcingaURL = "https://127.0.0.1:5665"
```

The username and password with which to authenticate to Icinga. 
Normally set in /etc/icinga2/conf.d/api-users.conf on your Icinga2 master.
```
IcingaUsername = "meerkat"
IcingaPassword = "YOUR SECURE PASSWORD HERE"
```

If IcingaInsecureTLS to true, verification of the TLS certificates served by the Icinga API is skipped. 
This is usually required when Icinga is configured with self-signed certificates.
```
IcingaInsecureTLS = true
```

**HTTP2**
If SSLEnable to true, meerkat will serve data over http2 using the crt and key.
A ssl cert and key is required if you enable ssl.
_This option is required for multiple dashboards to function, Meerkat uses eventstreams which are limited in http1, http2 has a higher limit._

```
SSLEnable = true
SSLCert = ""
SSLKey = ""
```

**Logging and Debug**
If `LogFile` is true, meerkat will log to file.
If `LogConsole` is true, meerkat will log to console.
All log files are stored in the Path specified in the `LogDirectory`.
```
LogFile = true
LogConsole = false
LogDirectory = "log/"
```

If `IcingaDebug` set to true meerkat will output icinga api debug information.
```
IcingaDebug = false
```

## Note
There is a sample configuration file in `contib/meerkat.toml.example` which is used when running the contrib install scripts.

