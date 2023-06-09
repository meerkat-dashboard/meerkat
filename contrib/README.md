# contrib

This directory contains extra stuff to help with distributing and running meerkat.

## configure-meerkat.sh
configure-meerkat.sh does meerkat user setup, application ownership, service installation and default config setup.
It assumes default values are being used.

```
USER="meerkat" 
INSTALL_DIR="/usr/local/meerkat" 
CONFIG_FILE="/etc/meerkat.toml" 
```

This script should be able to be re-run at any time if your configuration breaks, the config file `/etc/meerkat.toml` won't be overridden if it already exists.

## install-release.sh

This script downloads and installs the latest release, allowing you to customise the port and user meerkat runs as.
This is useful if you want to have multiple meerkats on one machine.
The SSL certificate is mandatory if you want HTTP/2 support for event streams.

Usage: install-release.sh --label LABEL --port PORT --user USER [--cert-name CERT_NAME] [--release-url RELEASE_URL]
  --label       Unique label for the meerkat instance under /usr/local/meerkat
  --user        User for the meerkat instance
  --port        Port for the meerkat instance
  --cert-name   Name for the SSL certificate
  --release-url URL of the meerkat release to download from GitHub

You can just grab this script and run it like so if you want to get up and running quickly:

sudo ./install-release.sh --label meerkattest --port 8586 --user meerkat --cert-name meerkat.local


## dlbuild.sh

dlbuild.sh ("download build") builds compiled archives from the main branch's latest revision of meerkat from GitHub.
Archives are built for each configured operating system and CPU architecture using ../mkdist.sh.
On success, the response from GitHub is cached.
Subsequent calls of dlbuild.sh will build new archives only if Github reports the repository has changed.
Built archives are placed in the default user cache directory at $HOME/.cache/meerkat-build.
Archives are named with the OS and CPU arch, with the format `meerkat.$os-$arch.tar.gz`.

* meerkat.linux-arm64.tar.gz
* meerkat.openbsd-amd64.tar.gz
* etc.

The script requires `curl` to be installed.

The intended use case is for `dlbuild.sh` to be run in a cron job, such as:

	0 * * * * /home/example/meerkat/contrib/dlbuild.sh

And for the created files to be served from a web server like `nginx`:

	cp /home/example/.cache/meerkat-build/*.tar.gz /var/www/html/

## meerkat.service

meerkat.service is a systemd unit file for running meerkat as a long-running process managed by systemd.
It assumes meerkat is installed as described in [Installing Meerkat][install].
To use it:

	cp meerkat.service /etc/systemd/system/
	systemctl daemon-reload
	systemctl enable meerkat
	systemctl start meerkat

[install]: https://meerkat.run/install

## meerkat.toml.example
meerkat.toml.example is a sample configuration with sensible defaults. It is copied when running `configure-meerkat.sh` to `/etc/meerkat.toml`.
**The password should be changed.**
