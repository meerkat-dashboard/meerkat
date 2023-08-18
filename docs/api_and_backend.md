# Meerkat API and Backend
Meerkat has a couple of api paths that provide view into what is occuring in the running server and admin tools that help manage the running server.

# API
## `/api/cache`
This is a listing of all the dashboards and the elements in each dashboard.

## `/api/status`
This provides the current status of the running Meerkat including

- Server Start time
- List of Dashboards and some properties
- Backends Meerkat is aware of with each backend having
  - Backend properties
  - Recent api calls made and events captured from that backend

# Tools
## `/cache`
The cache page allows you to tell the Meerkat server to clear it's internal caches. 

**Dashboard Cache**
The dashbaord cache is a cache of all the dashboards currently open and the list of Icinga objects associated with each dashboard, clearing this cache will...

**Object Cache**
The object cache is a cache of all the Icinga objects Meerkat is currently tracking and their current state, clearing this cache will...