# Installing Meerkat

Prebuilt releases are available for Linux on the AMD64 architecture.

For installing from source, see the [Meerkat README](https://github.com/meerkat-dashboard/meerkat).

## 1. Download Meerkat

* Linux [meerkat3.0.0-beta.1.linux-amd64.tar.gz]
* [meerkat2.1.1]

Releases of Meerkat are available from [Releases](https://github.com/meerkat-dashboard/meerkat/releases/).

[meerkat3.0.0-beta.1.linux-amd64.tar.gz]: https://github.com/meerkat-dashboard/meerkat/releases/download/v3.0.0-beta.1/meerkat.3.0.0-beta.1.linux-amd64.tar.gz
[meerkat2.1.1]: https://github.com/meerkat-dashboard/meerkat/releases/tag/2.1.1

## 2. Install Meerkat

1. Extract the tar archive into /usr/local:
```
tar -C /usr/local -xzf meerkat.tar.gz
```
You will probably need to run this command as root or through `sudo`.

2. Write a configuration file. The example configuration file is enough to create basic dashboards.
```
cp /usr/local/meerkat/meerkat.toml.example /usr/local/meerkat/meerkat.toml
```

3. Verify the meerkat installation by running the meerkat command and printing its version:
```
/usr/local/meerkat/meerkat -v
```

## 3. Start Meerkat
```
/usr/local/meerkat/meerkat -config /usr/local/meerkat/meerkat.toml
```

Open a web browser and browse to the address of the machine.

We're done!

This set up is only sufficient for basic dashboards, testing, and fiddling around.
Meerkat's primary use case is to display information from [Icinga2](https://icinga.com).
Follow the [Connecting Icinga tutorial](connect-icinga) to set this up.

Meerkat is intended to be run as a long-running service.
See the tutorial [Meerkat as a systemd service](tutorial/systemd) to set this up.
