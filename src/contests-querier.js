const https = require("https");

const MS_DAY = 1000 * 60 * 60 * 24;

// A querier that relies on https://clist.by/
// Contest format:
// {
//   duration: seconds,
//   end: ISO UTC time,
//   event: contest name,
//   href: URL,
//   id: string,
//   resource: does not matter,
//   start: ISO UTC time
// }
class ClistClient {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.timerId = null;
    this.contests = [];
    this.observers = new Set();
  }

  registerObserver(obs) {
    return this.observers.add(obs);
  }

  unregisterObserver(obs) {
    return this.observers.delete(obs);
  }

  query(days) {
    const now = new Date().toISOString();
    const next = new Date(new Date().getTime() + MS_DAY * days).toISOString();
    https
      .get(
        {
          hostname: "clist.by",
          path: `/api/v1/contest/?limit=1000&start__gt=${now}&start__lt=${next}&format=json&username=davidguandev&api_key=${
            this.apiKey
          }`
        },
        res => {
          let ret = "";
          res.on("data", d => {
            ret += d;
          });

          res.on("end", () => {
            try {
              const parsedRet = JSON.parse(ret);
              parsedRet.objects.forEach(d => {
                // normalize the date to ISO format.
                d.start += "+00:00";
                d.end += "+00:00";
              });
              this.contests = parsedRet.objects;
            } catch (e) {
              this.logger.captureException(e);
              return;
            }
            this.notify();
          });
        }
      )
      .on("error", e => {
        this.logger.captureException(e);
      });
  }

  notify() {
    for (const obs of this.observers) {
      if (obs.update) {
        obs.update(this.contests);
      }
    }
  }

  startQuery(interval = 1000, days = 14) {
    this.timerId = setInterval(() => {
      this.query(days);
    }, interval);
  }

  stopQuery() {
    if (!this.timerId) return;
    clearInterval(this.timerId);
    this.timerId = null;
  }
}

module.exports = {
  ClistClient
};
