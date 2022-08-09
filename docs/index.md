## Meerkat - A Dashboarding tool for Icinga2

Meerkat is a utility to create and share dashboards for Icinga2. It's quick to setup and easy to use. There is a WSIWYG editor interface when you can set a background for a dashboard and start overlaying checks which update in real time by polling the Icinga2 API via the Meerkat backend.

The main driver for Meerkat to exist is to communicate to perhaps non-technical users, the relationship between the infrastructure they are familar with, and the Icinga checks you have worked so hard to build. It can also play sounds to alert people of changes, along with embed video and audio streams. Meerkat isn't a replacement for a complete notification system, but should complement any NOC nicely, and let users very clearly define the checks or groups of checks they care about with context that is relevant for them.

Meerkat displays the 'worst' status from a group of checks, for example a world map that consists of groups of checks by country:

![Meerkat World Map](/meerkat_world_map.png)

Or a video workflow from left to right:

![Video Work Flow](/videoworkflow.png)

This check uses the Icinga Business Process module to quickly show the overall path is OK, even if one of the paths is having problems.

## Getting Started

Once Meerkat is installed and configured, you simply browse it, make a new dashboard, upload a background, and start dragging and dropping elements over the background. You then give the 'view' link to users to put on TVs on the wall, and you have a ready made NOC.

### Using Meerkat

Once you have Meerkat up and running, you will want to create your first dashboard. Its probably best to have a sensible background first. The background needs to be a browser displayable image, even an animated gif is possible! We have used diagram tools for backgrounds, pictures of racks, world maps etc. It helps if you have thought about how you want the checks and background image to overlay together beforehand. You can author the Background Image in any program that can spit out image files that browsers can display, we have tested png, jpeg and webp. The background resolution should match the target resolution of the display, to allow for correct alignment and scaling.

1) Make a new dashboard by clicking Create New Dashboard button and giving it a name. Dashboards can then be edited and viewed from the main page.
2) Edit your dashboard and add a Background Image.
3) Add new Elements and pick the type of Element you want to add.
4) Drag and drop your Element over the top of the map to somewhere that makes sense relative to the background. You can resize and rotate elements.
5) Remember to click Save. Many times.
6) Once done, click Home and then view your dashboard.


Dashboards are saved as json files under the `dashboards` directory which get generated on startup, so backing up or moving data is easy. The `dashboard-data` directory is for image/file data.

**This tool is designed to be used internally, there is no user management and it has direct access to the Icinga2 API (with some minor filtering) I would not recommend putting this on the internet. You can limit the API user using filters as per the Icinga docs here: https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/#icinga2-api-permissions **


### Element Types

Meerkat supports various element types, some sourced from the Icinga API backend, and others static.
Icinga type elements can select from the following sources: Hosts, Services, Host Groups, Service Groups, Host Filter, Service Filter and All Services on a Host.
These sources are largely self-explanatory, however the filter language for the Filter sources is a little unintuitive. The base doco is here: https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/#advanced-filters and some hints are provided in the input dialog. You can also set a Linking URL for these elements which let you link to somewhere else, like another dashboard, or Icingaweb.


#### Icinga Card
A simple rectangular card that displays the status of the check. You can adjust the font size. Now includes a performance data mode, so you can display performance data numbers, along with status.

#### Icinga SVG
You can select an SVG to toggle between for the various states. The default SVGs are sensible, however feel free to choose whatever makes sense to you. There isn't a way to change the global defaults just yet.

#### Icinga Image
Select a set of images you want to toggle between on state change.

#### Icinga Line
Allows you to draw lines, you can rotate and resize them, and set the weight. They only toggle between OK, Warning, Critical, Unknown at present.

#### Dynamic Text
Allows you to display some of the text of a service output. Handy to print a dynamic message to users.

#### Static Text, SVG and Image
Useful for adding headings or labels.

#### Static Ticker
A scrolling ticker you can use to display outage notifications or maintenance windows to your users.

#### HLS and Audio Stream
Embed video or audio streams in the dashboards in case staring at the dashboard is boring. (or you really care about the video!)

### Sounds
Meerkat allows you to specify a global sound scheme for state change, as well as upload custom sounds. Each check can also have different sounds triggered on state change. Yes you can have the sysadmin DJ soundboard of doom you always wanted!


Future enhancements may include:
* Authentication support (though it is meant to be displayed on a wall, without auth mostly)
* Automation for creation of the dashboard config, allowing for easy mass creation of dashboards from Icinga data
* Automation for export of Meerkat dashboards to Business Processes

### Support
Sol1 is an official Icinga Enterprise Partner, and can offer commercial support for Meerkat and Icinga and friends. We are a friendly bunch of people, so please don't hesitate to get in touch at http://sol1.com.au

### Contributing
We welcome any contributions. Let us know via the issues here if there is something you need fixed up, or even better, a patch or PR would be most appreciated.

[Sounds from Notification Sounds](https://www.notificationsounds.com) provided under the creative commons 4.0 license

License is GNU Affero GPLv3.
