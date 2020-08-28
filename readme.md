# Meerkat

A utility to create and share dashboards for icinga2 checks and hosts. Meerkat a lightweight service which only requires a Go server and a small amount of javascript (only 14KB gzipped) for the frontend. It's quick to setup and easy to use. There is an editor interface when you can set a background for a dashboard and start overlaying checks which update by polling the Icinga2 API via the Meerkat backend.

**TODO include screenshot of a good/realistic dashboard**

Dashboards are saved as json files under the `dashboards` directory which get generated on startup, so backing up or moving data is easy. The `dashboard-data` directory is for image/file data.

**This tool is designed to be used internally, there is no user management and it has direct access to the Icinga2 API (with some minor filtering) I would not recommend putting this on the internet.**

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
**Needs Golang 1.13 at least (you will need newer packages on Debian 10)**
 - `go build` in the root directory of this project to build the server
 - From the `frontend` directory run `npm i` which installs JS dependencies
 - `npm run prod` from the frontend directory which builds the frontend code (`index.html` loads this output (`bundle.js`))
 - You can then run `./meerkat -config meerkat.toml` after creating the config file above