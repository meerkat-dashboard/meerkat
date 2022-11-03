# Upgrading to Meerkat 3
{: .no_toc }

1. TOC
{:toc}

---

## Change Summary

Meerkat 3 includes the latest release of Bootstrap 5 (v5.2).
For information on browser support, see the [Bootstrap browsers and devices page][bootstrap-browsers].
Notably Internet Explorer is no longer officially supported.

Bootstrap is used throughout the entire GUI.
You'll notice a more consistent feel, with many alignment and layout bugs resolved.

Readability and usability improvements:
* More inline tips and placeholders scattered throughout the interface for guidance
* Increased text contrast on coloured elements
* Replace `<div>` HTML elements with more meaningful `<section>`, `<fieldset>` etc. HTML elements.
* Standard HTML forms and pages replace custom interface elements like Javascript modals.

HLS Stream elements are rendered with standard HTML5 `<video>` tags rather than a Javascript player.

All Javascript vulnerabilities reported by npm are resolved.

Meerkat is no longer a "Single Page Application", and serves more conventional URL paths present in other web apps.
Popular HTTP reverse proxies (e.g. Nginx, HAProxy) can now be used for basic access control;
even on a per-dashboard basis.
For example, to view, edit, delete a dashboard named "networking", the corresponding URLs are:

* https://demo.meerkat.run/test/view
* https://demo.meerkat.run/test/edit
* https://demo.meerkat.run/test/delete

A new [About page][about] shows the installed version of Meerkat and build time.

Installation is easier.
The GUI is now served directly from the binary,
rather than from a directory on the filesystem.
Installation is therefore just copying a single file (the binary).

[bootstrap-browsers]: https://getbootstrap.com/docs/5.2/getting-started/browsers-devices
[about]: https://demo.meerkat.run/about

## Prepare

There are changes to the dashboard's on-disk format.
Back up existing dashboards:

	tar cv /usr/local/meerkat/dashboards > dashboards.tar

## Install

Follow the [install instructions][install].

[install]: /install

## Post-install steps

These instructions assume Meerkat is installed in the default installation directory `/usr/local/meerkat`.

### 1. Remove frontend directory

The file tree providing the frontend GUI is now embedded into the `meerkat` command.
The frontend directory is now ignored and can be safely removed:

	rm -r /usr/local/meerkat/frontend

### 2. Rename font size option

The `statusFontSize` element option has been renamed to `fontSize`.
To update existing elements, run the following command to rename the options:

	sed -i 's/statusFontSize/fontSize/g' /usr/local/meerkat/dashboards/*.json
