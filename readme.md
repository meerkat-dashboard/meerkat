# Meerkat

A utility to create and share dashboards for icinga2 checks and hosts.

### Sample config
You can use the `-config` flag to specify an alternative config path
```
HTTPAddr = "localhost:8585"

IcingaURL      = ""
IcingaUsername = ""
IcingaPassword = ""
```

### TODO
 - Make dashboard elements percentage based so they're relative to screen size
 - Add tags to dashboards
 - Save and retrieve dashboards
 - Home page actually list dashboards
 - Filter on homepage
 - Improve card appearence
 - Ability to re-order checks/statics
 - Implement Statics (Start with lines)
 - Add icinga service/host searching
 - Add icinga service/host polling