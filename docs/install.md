# Installing Meerkat

Prebuilt releases are available for Linux on the AMD64 architecture.

For installing from source, see the [Meerkat README](https://github.com/meerkat-dashboard/meerkat).

## 1. Download the installation script

```sh
cd /tmp
wget https://github.com/meerkat-dashboard/meerkat/blob/main/contrib/download-install-latest-release.sh
chmod +X download-install-latest.release.sh
```

## 2. Run setup script

```sh
Usage: download-install-latest-release.sh --port PORT --user USER [--label LABEL] [--cert-name CERT_NAME] [--release-url RELEASE_URL]
  --user        User for the meerkat instance
  --port        Port for the meerkat instance
  --label       Unique label for the meerkat instance under /usr/local/meerkat
  --cert-name   Name for the SSL certificate
  --release-url URL of the meerkat release to download from GitHub
```
##### Standard installation
```sh
sudo ./download-install-latest-release.sh --port 8080 --user meerkat
```

##### Multiple Meerkat installation
The below would install meerkat to different directories and run it on different ports.
```sh
sudo ./download-install-latest-release.sh --port 8080 --user meerkat --label foo
sudo ./download-install-latest-release.sh --port 8081 --user meerkat --label bar
```
These will have different configuration files, install directories and service name based on the label.
Service Name: `meerkat-foo`, `meerkat-bar`
Config: `/etc/meerkat-foo.toml`, `/etc/meerkat-bar.toml`
Install Directory: `/usr/local/meerkat-foo/`, `/usr/local/meerkat-bar/`

## 3. Configure Meerkat
To configure Meerkat you must edit the `meerkat.toml` [configuration file](configuration) (Default location is `/etc/meerkat.toml`)

## 4. Start Meerkat

##### Standard installation
```
systemctl start meerkat
```
##### Multiple Meerkat installatiom
```
systemctl start meerkat-[label]
```

Open a web browser and browse to the address of the machine.

We're done!

This set up is only sufficient for basic dashboards, testing, and fiddling around.
Meerkat's primary use case is to display information from [Icinga2](https://icinga.com).
Follow the [Connecting Icinga tutorial](tutorial/connect-icinga) to set this up.

Meerkat is intended to be run as a long-running service.
See the tutorial [Meerkat as a systemd service](tutorial/systemd) to set this up.
