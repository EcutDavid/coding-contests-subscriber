This tool helps us subscribing coding contests that friendly to our preferred time, e.g., started between 8 AM - 9 PM.

Like:
![](https://user-images.githubusercontent.com/10692276/57193666-095c0280-6f81-11e9-8112-53b85682925d.png)

## How it works

1. Fetching the available contests via [clist](https://clist.by/).
1. Filtering the contests based on the time window.
1. Sending invites via [google calendar API](https://developers.google.com/calendar/).
1. Store contests that successfully sent, so same contest won't be notified twice.

## How to use

### Required

1. We have to provide the [clist](https://clist.by/) username & key to query the contests, we can get them from https://clist.by/api/v1/doc/.

```
CLIST_KEY=foo CLIST_USER_NAME=bar node main.js
```

2. We have to provide the basic user/users information so that contests can be filtered. This tool will ask us to add new users via CLI(so we don't have to modify the data store directly).

```
... node main.js
(node:92487) ExperimentalWarning: The fs.promises API is experimental
There are 0 users in data store right now.
Add a new user?(Y/N):
```

Example:

```
Add a new user?(Y/N): Y
Email: davidguandev@gmail.com
Preferred earliest start hour(0 - 23, integer): 8
Preferred latest start hour(0 - 23, integer): 20
Timezone in UTC(-12 - 12): 10
Adding user davidguandev@gmail.com
Add a new user?(Y/N):
```

### Optional

1. If the calendar events(currently, only Google calendar is supported) need to be sent, we need put google API's credential configuration file into the directory as the `main.js`, otherwise, the contest will just be printed to console, like:

```
Contest Problem 670, https://projecteuler.net/news is friendly to davidguandev-test@gmail.com
Contest CTF 313 2019, https://ctftime.org/event/807/ is friendly to davidguandev-test@gmail.com
Contest Harekaze CTF 2019, https://ctftime.org/event/789/ is friendly to davidguandev-test@gmail.com
Contest "Пятёрка за неделю" №B, для начинающих, http://acmu.ru/asp/champ/index.asp?main=stage_info&id_stage=41196 is friendly to davidguandev-test@gmail.com
Contest Problem 671, https://projecteuler.net/news is friendly to davidguandev-test@gmail.com
...
```

We can download the `credentials.json` via https://developers.google.com/calendar/quickstart/nodejs, please rename it to `google-credentials.json` :)

2. We can provide our Sentry DSN via `SENTRY_DSN` env variable, so that logs would be sent to our Sentry project, otherwise, they would only appear in stdout and stderr.

3. We can provide our remote mongo connection URL via `MONGO_CONNECTION_URL` env variable, otherwise, file system will be used as the data store. The default database name is "contests-sub", we can overwrite it via `MONGO_DB_NAME` env variable.
