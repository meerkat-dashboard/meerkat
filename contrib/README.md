# contrib

This directory contains extra stuff to help with distributing and running meerkat.

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
