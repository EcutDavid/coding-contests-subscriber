This tool helps us subscribing coding contests that friendly to your wake-up time, e.g., started between 8 AM - 9 PM.

Like:
![](https://user-images.githubusercontent.com/10692276/57193666-095c0280-6f81-11e9-8112-53b85682925d.png)

## How it works

1. Fetching the available contests via [clist](https://clist.by/).
1. Filtering the contests based on the time window.
1. Sending invites via [google calendar API](https://developers.google.com/calendar/).
1. Store contests that successfully sent, so same contest won't be notified twice.

## How to use

1. We have to provide the [clist](https://clist.by/) username & key to query the contests, we can get them from https://clist.by/api/v1/doc/.

```
CLIST_KEY=foo CLIST_USER_NAME=bar node main.js
```

2. If the calendar events(currently, only Google calendar is supported) need to be sent, we need put google API's credential configuration file into the directory as the `main.js`, otherwise, the contest will just be printed to console, like:

```
Contest Problem 670, https://projecteuler.net/news is friendly to davidguandev-test@gmail.com
Contest CTF 313 2019, https://ctftime.org/event/807/ is friendly to davidguandev-test@gmail.com
Contest Harekaze CTF 2019, https://ctftime.org/event/789/ is friendly to davidguandev-test@gmail.com
Contest "Пятёрка за неделю" №B, для начинающих, http://acmu.ru/asp/champ/index.asp?main=stage_info&id_stage=41196 is friendly to davidguandev-test@gmail.com
Contest Problem 671, https://projecteuler.net/news is friendly to davidguandev-test@gmail.com
...
```

We can download the `credentials.json` via https://developers.google.com/calendar/quickstart/nodejs, please rename it to `google-credentials.json` :)

3. We can provide your Sentry DSN via `SENTRY_DSN` env variable, so that logs would be sent to your Sentry project, otherwise, they would only appear in stdout and stderr.

4. We can provide your remote mongo connection URL via `MONGO_CONNECTION_URL` env variable, otherwise, file system will be used as the data store. The default database name is "contests-sub", we can overwrite it via `MONGO_DB_NAME` env variable.
