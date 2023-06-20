# Dashboard Elements

Meerkat supports various element types, some sourced from the Icinga API backend, and others static.

## Icinga Elements

Icinga elements require a connection to an Icinga server to be configured.
See the [Connecting Icinga](tutorial/connect-icinga) tutorial for instructions on how to set this up.

The source of Icinga elements may be one of Hosts, Services, Host Groups, Service Groups, Host Filter, Service Filter or All Services on a Host.

The filter language for the Filter sources is a little unintuitive.
The base doco is here: https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/#advanced-filters
Some hints are provided in the input dialog.

You can also set a Linking URL for these elements which let you link to somewhere else, like another dashboard, or Icingaweb.

### Icinga Card
A simple rectangular card that displays the status of the check. You can adjust the font size.
In performance data mode, performance data numbers can be displayed, along with status.

### Icinga SVG
You can select an SVG to toggle between for the various states. The default SVGs are sensible, however feel free to choose whatever makes sense to you. There isn't a way to change the global defaults just yet.

### Icinga Line
Allows you to draw lines, you can rotate and resize them, and set the weight. They only toggle between OK, Warning, Critical, Unknown at present.

## Static Text, SVG and Image
Useful for adding headings or labels.

## Static Ticker
A scrolling ticker you can use to display outage notifications or maintenance windows to your users.

## HLS and Audio Stream
Embed video or audio streams in the dashboards in case staring at the dashboard is boring. (or you really care about the video!)

## Sounds
Meerkat allows you to specify a global sound scheme for state change, as well as upload custom sounds. Each check can also have different sounds triggered on state change. Yes you can have the sysadmin DJ soundboard of doom you always wanted!
