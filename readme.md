# Meerkat

A utility to create and share dashboards for icinga2 checks and hosts. Meerkat a lightweight service which only requires a Go server and a small amount of javascript (only 14KB gzipped) for the frontend. It's quick to setup and easy to use. There is an editor interface when you can set a background for a dashboard and start overlaying checks which update by polling the Icinga2 API via the Meerkat backend.

**TODO include screenshot of a good/realistic dashboard**

Dashboards are saved as json files under the `dashboards` directory which get generated on startup, so backing up or moving data is easy. The `dashboard-data` directory is for image/file data.

**This tool is designed to be used internally, there is no user management and it has direct access to the Icinga2 API (with some minor filtering) I would not recommend putting this on the internet.**


### Build / Run

For dev, you will need Docker on your local machine, GNU Make, and a sol1 VPN.

Create `backend/meerkat.toml` with the following contents:

```
HTTPAddr = "[::]:8585"

IcingaURL = "https://icinga.example.com:5665"
IcingaUsername = "someuser"
IcingaPassword = "somepassword"
IcingaInsecureTLS = true
```

Then start three terminal windows / tabs / whatever.

In the first, run

```
make backend-dev
```

This will give you a shell prompt in a Docker container, from which you should
be able to run

```
go run .
```

Initially, this will download the Golang dependencies, build the code, and
run it.  Every time you want to test updated backend code, hit `Ctrl-C` and
then run `go run .` again (up-arrow is your friend).  If the build fails,
you'll get errors and you can fix them.

In the second terminal window / tab / whatever, run

```
make frontend-dev
```

This will start up a second Docker container, but this one will install
NPM modules, build the frontend, and then wait for changes to the frontend
source code and automatically recompile the `bundle.js` and friends.  All
you need to do after saving changes to the frontend code, then, is wait
a second or two and reload your browser tab.  The future: we are living in it.

The third terminal window / tab / whatever, run

```
make browse-dev
```

This should open up a new tab in your web browser, pointing at the dev
copy of Meerkat.  It will only work if the backend dev container is running.
