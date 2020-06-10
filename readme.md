# Meerkat

A utility to create and share dashboards for icinga2 checks and hosts.

### Sample config
You can use the `-config` flag to specify an alternative config path
```
HTTPAddr = "localhost:8585"

IcingaURL      = "https://icinga.example.com:5665"
IcingaUsername = "api-user"
IcingaPassword = "api-password"
IcingaInsecureTLS = false
```

### TODO
 - Add tags to dashboards
 - Ability to re-order checks/statics
 - Implement Statics (Start with lines)