# Meerkat - A Dashboarding tool for Icinga2

Meerkat is a utility to create and share dashboards for Icinga2. It's quick to setup and easy to use. There is a WSIWYG editor interface when you can set a background for a dashboard and start overlaying checks which update in real time by polling the Icinga2 API via the Meerkat backend.

The main driver for Meerkat to exist is to communicate to perhaps non-technical users, the relationship between the infrastructure they are familar with, and the Icinga checks you have worked so hard to build. It can also play sounds to alert people of changes, along with embed video and audio streams. Meerkat isn't a replacement for a complete notification system, but should complement any NOC nicely, and let users very clearly define the checks or groups of checks they care about with context that is relevant for them.

Meerkat displays the 'worst' status from a group of checks, for example a world map that consists of groups of checks by country:

![Meerkat World Map](/meerkat_world_map.png)

Or a video workflow from left to right:

![Video Work Flow](/videoworkflow.png)

This check uses the Icinga Business Process module to quickly show the overall path is OK, even if one of the paths is having problems.

## Getting Started

### [Install Meerkat](install)

Downloading and installing Meerkat.

### [Tutorial: Connecting Icinga](tutorial/connect-icinga)

Connect Meerkat to Icinga to create dashboards from Icinga objects like Services and HostGroups.

### [Tutorial: Create a dashboard](tutorial/create-dashboard)

How to make a simple dashboard.

## Using Meerkat

### [Dashboard Elements](elements)

A description of all the different elements which make up dashboards.

### [Configuring Meerkat](configuration)

A reference for the Meerkat configuration file.

### [Operations](operations)

Notes on operating Meerkat in real, production environments; security, backup strategies, and more.

## Support

Sol1 is an official Icinga Enterprise Partner, and can offer commercial support for Meerkat and Icinga and friends. We are a friendly bunch of people, so please don't hesitate to get in touch at http://sol1.com.au

## Contributing

We welcome any contributions. Let us know via the issues here if there is something you need fixed up, or even better, a patch or PR would be most appreciated.

[Sounds from Notification Sounds](https://www.notificationsounds.com) provided under the creative commons 4.0 license

License is GNU Affero GPLv3.
