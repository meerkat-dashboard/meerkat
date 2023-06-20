# Upgrading to Meerkat 3

---

## Change Summary

Meerkat now uses event streams for both dashboard to Meerkat communication and Icinga2 to Meerkat Service communication. This change reduces the number of API calls to Icinga2 and improves the responsiveness of dashboards to changes in check state.

Security has been improved by scrubbing the incoming data to only include required information.

Backgrounds and Sounds upload and management are now independent of dashboards and accessed via a Assets menu. 

Dashboards being viewed anywhere will update automatically when the dashboard is edited and saved. This update functionality also triggers when Icinga2 configuration changes or the Meerkat Service or Icinga Server connections fail.

Readability and usability improvements:
* More inline tips and placeholders scattered throughout the interface for guidance
* Replace `<div>` HTML elements with more meaningful `<section>`, `<fieldset>` etc. HTML elements.
* Standard HTML forms and pages replace custom interface elements like Javascript modals.

Meerkat 3 includes the latest release of Bootstrap 5 (v5.2).
For information on browser support, see the [Bootstrap browsers and devices page](https://getbootstrap.com/docs/5.2/getting-started/browsers-devices).
Notably Internet Explorer is no longer officially supported.

Bootstrap is used throughout the entire GUI.

Meerkat is no longer a "Single Page Application", and serves more conventional URL paths present in other web apps.

Paths of a dashboard's URL have changed from previous releases.
Old
https://meerkat2.example.com/view/test
https://meerkat2.example.com/edit/test

New
https://meerkat3.example.com/test/view
https://meerkat3.example.com/test/edit
https://meerkat3.example.com/test/delete

URLs in the previous format continue to work via a permanent redirect.
Nonetheless, where possible, it is encouraged to update URLs to the new format.

A new [About page](https://demo.meerkat.run/about) shows the installed version of Meerkat and build time.

Installation is easier. With install scripts in the `contrib` directory to assist with installation and configuration.

The GUI is now served directly from the binary, rather than from a directory on the filesystem.




## Prepare

There are changes to the dashboard's on-disk format.
Back up existing dashboards:

```
cd <meerkat directory>
tar -cvf dashboards.tar dashboards dashboards-data
```
 _Restore command if you need to restore the old data_
 ```
 tar -xvf dashboards.tar
 ```


## Install

Don't install Meerkat over the top of itself, if you want Meerkat to be installed in the same location rename the existing installation directory.

Follow the [install instructions](/install).

## Post-install steps

These instructions assume Meerkat is installed in the default installation directory `/usr/local/meerkat`.

### Dashboard Migration
The migrator is written in Python and requires `python3` to run

Run the migrator from the root directory. The migrator 
* takes a single dashabord
* backs it up
* backs up the destination if the destination exists
* then rewrites the dashboard to the new version

##### Dry run
```
python3 ./migrations/meerkat_v3.py --dashboard /usr/local/meerkat/dashboards/yourdashboard.json
```

##### Live Run
```
python3 ./migrations/meerkat_v3.py --dashboard /usr/local/meerkat/dashboards/yourdashboard.json --live
```

##### Live Run with Folder allocation
Folders are a way of grouping like dashboards together.
```
python3 ./migrations/meerkat_v3.py --dashboard /usr/local/meerkat/dashboards/yourdashboard.json --folder stuff --live 
```

##### Live Run for multiple dashboards
Folders are a way of grouping like dashboards together.
```
for d in /usr/local/meerkat/dashboards/stuff*.json ; do python3 ./migrations/meerkat_v3.py --dashboard $d --folder stuff --live ; done
```


##### Move sounds from dashboards-data to dashboards-sound
Dashboard sounds have been given their own directory `dashboards-sound`.
```
mv /old/meerkat/dashboards-data/*.mp3 /usr/local/meerkat/dashboards-sound/
mv /old/meerkat/dashboards-data/*.wav /usr/local/meerkat/dashboards-sound/
```
_Repeat for any other formats you have_
##### Move backgrounds from dashboards-data to dashboards-background
Dashboard backgrounds have been given their own directory `dashboards-background`.
```
mv /old/meerkat/dashboards-data/*.png /usr/local/meerkat/dashboards-background/
mv /old/meerkat/dashboards-data/*.jpg /usr/local/meerkat/dashboards-background/
```
_Repeat for any other formats you have_

or if you did the sounds first just move the remaining data to backgrounds
```
mv /old/meerkat/dashboards-data/*.* /usr/local/meerkat/dashboards-background/
```

