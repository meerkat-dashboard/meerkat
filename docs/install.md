# Installing Meerkat

Prebuilt releases are available for Linux on the AMD64 architecture.

For installing from source, see the [Meerkat README](https://github.com/meerkat-dashboard/meerkat).

## 1. Download Meerkat

Download the latest version of Meerkat:
[Version 2.0 (Savanna)](https://github.com/meerkat-dashboard/meerkat/releases/tag/2.0.3)

## 2. Install Meerkat

1. Extract the tar archive into /usr/local:
```
tar -C /usr/local -xzf meerkat.tar.gz
```
You will probably need to run this command as root or through `sudo`.

2. Write a configuration file. The example configuration file is enough to create very basic dashboards.
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

Open a web browser and browse to the IP address of the machine.

We're done!

This set up is only sufficient for the most basic dashboards, testing, or fiddling around.
Meerkat's primary use case is to display information from [Icinga2](https://icinga.com).
Follow the [Connecting Icinga tutorial](connect-icinga) to set this up.
