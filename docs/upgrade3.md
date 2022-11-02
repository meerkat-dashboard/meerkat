# Upgrading to Meerkat 3

## Prepare

There are changes to the dashboard's on-disk format.
Back up existing dashboards:

	tar cv /usr/local/meerkat/dashboards > dashboards.tar

## Upgrade steps

These instructions assume Meerkat is installed in the default installation directory `/usr/local/meerkat`.

### 1. Frontend directory

The file tree providing the frontend GUI is now embedded into the `meerkat` command.
The frontend directory is now ignored and can be safely removed:

	rm -r /usr/local/meerkat/frontend

### 2. Font size option

The `statusFontSize` element option has been renamed to `fontSize`.
To update existing elements, run the following command to rename the options:

	sed -i 's/statusFontSize/fontSize/g' /usr/local/meerkat/dashboards/*.json
