# Meerkat

Meerkat is a utility to create and share dashboards for Icinga 2 checks and hosts. It is comprised of a lightweight Go server and a browser front-end written in Preact. It's quick to setup and easy to use.

Meerkat's editor interface allows you to create a dashboard by setting a background image then start overlaying checks represented by widgets which automatically update by polling the Icinga API via the Meerkat backend.

![Meerkat World Map](docs/meerkat_world_map.png)

Dashboards are saved as json files under the `dashboards` directory which get generated on startup, so backing up or moving data is easy. The `dashboard-data` directory is for image/file data.

**Note**: This tool is designed to be used internal to your network! There is no user management, and it has direct access to the Icinga API. We do not recommend publishing a Meerkat instance on the Internet. You can limit the API user's access using filters as per the Icinga docs here: https://icinga.com/docs/icinga-2/latest/doc/12-icinga2-api/#icinga2-api-permissions

## Development

First, build the frontend. Install dependencies, then build the application bundle:

	cd frontend
	npm install
	npm run build

Next, build the backend.
The meerkat executable serves the frontend bundle from "frontend" directory,
so write the binary to the repository root:

	cd backend
	go build -o ..

Finally, run meerkat and provide a configuration file:

	cd ..
	./meerkat -config config/meerkat.toml

Or on Windows

	cd ..
	.\meerkat.exe -config config\meerkat.toml

See `config/meerkat.toml.example` for an example configuration file.

## Configuring Icinga

Meerkat communicates with Icinga via its HTTP API. This requires authentication. Here is an example `ApiUser` object with limited, read-only privileges:

```
object ApiUser "meerkat" {
  password = "meerkatpassword"
  permissions = [ "objects/query/Host", "objects/query/Service", "objects/query/ServiceGroup", "objects/query/HostGroup" ]
}
```

In a default Icinga2 installation, you can write this definition to `/etc/icinga2/conf.d/api-users.conf`.

## Using Meerkat

Once you have Meerkat up and running, you will want to create your first dashboard. It's probably best to add a sensible background image first. The image should be  a browser-compatible image, such as png, jpeg, webp or even an animated gif!

It helps if you have thought about how you want the checks and background image to overlay together beforehand. We have used flow charts, pictures of racks, geographical maps and more.

1) Make a new dashboard by clicking the "Create New Dashboard" button and giving it a name. Dashboards can then be edited and viewed from the main page.
2) Edit your dashboard and add a Background Image.
3) Add new Elements and pick the type of Element.
4) Drag and drop your Element over the top of the map to somewhere that makes sense relative to the background. You can resize and rotate elements.
5) Remember to click Save. Many times.
6) Once done, click Home and then view your dashboard.

### Element Types

Meerkat supports various element types, some sourced from the Icinga API backend, and others static.
Icinga type elements can select from the following sources: Hosts, Services, Host Groups, Service Groups, Host Filter, Service Filter and All Services on a Host.
These sources are largely self-explanatory, however the filter language for the Filter sources is a little unintuitive. The base doco is here: https://icinga.com/docs/icinga-2/latest/doc/12-icinga2-api/#advanced-filters and some hints are provided in the input dialog. You can also set a Linking URL for these elements which let you link to somewhere else, like another dashboard, or Icingaweb.

#### Icinga Card
A simple rectangular card that displays the status of the check. You can adjust the font size.

#### Icinga SVG
You can select an SVG to toggle between for the various states. The default SVGs are sensible, however feel free to choose whatever makes sense to you. There isn't a way to change the global defaults just yet.

#### Icinga Image
Select a set of images you want to toggle between on state change.

#### Icinga Line
Allows you to draw lines, you can rotate and resize them, and set the weight. They only toggle between OK, Warning, Critical, Unknown at present.

#### Dynamic Text
Allows you to pull text out of a selected Icinga Host custom variable and display it like a card. Useful if you plumb these custom vars in from your CMDB, allowing you to provide more accurate context to the dashboard users.

#### Static Text, SVG and Image
Useful for adding headings or labels.

#### HLS and Audio Stream
Embed video or audio streams in the dashboards in case staring at the dashboard is boring. (or you really care about the video!)

### Sounds
Meerkat allows you to specify a global sound scheme for state change, as well as upload custom sounds. Each check can also have different sounds triggered on state change. Yes you can have the sysadmin DJ soundboard of doom you always wanted!

### Docker images

A meerkat Docker image is available at https://hub.docker.com/r/sol1/meerkat or you can build one locally with

```
docker build -t meerkat .
```

### Support
Sol1 is an official Icinga Enterprise Partner, and can offer commercial support for Meerkat and Icinga and friends. We are a friendly bunch of people, so please don't hesitate to get in touch at https://sol1.com.au.

### Contributing
We welcome any contributions. Let us know via the issues here if there is something you need fixed up, or even better, a patch or PR would be most appreciated.

[Sounds from Notification Sounds](https://www.notificationsounds.com) provided under the creative commons 4.0 license

License is GNU Affero GPLv3.
