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

### Build / Run
 - `go build` in the root directory of this project to build the server
 - From the `frontend` directory run `npm i` which installs JS dependencies
 - `npm run prod` from the frontend directory which builds the frontend code (`index.html` loads this output (`bundle.js`))
 - You can then run `./meerkat -config meerkat.toml` after creating the config file above

### TODO
 - Add tags to dashboards
 - Ability to re-order checks/statics
 - Implement Statics (Start with lines)