const MS_DAY = 1000 * 60 * 60 * 24;

// A querier that relies on https://clist.by/
class ClistClient {
  constructor(apiKey) {
    this.timerId = null;
    this.contests = [];
    this.getContests = this.getContests.bind(this);
    this.apiKey = apiKey;
  }

  getContests() {
    return this.contests;
  }

  startQuery(interval = 1000, days = 2) {
    this.timerId = setInterval(() => {
      const https = require("https");
      const now = new Date();
      const next = new Date(now.getTime() + MS_DAY * days);

      https
        .get(
          `https://clist.by/api/v1/contest/?limit=1000&start__gt=${now.toISOString()}&start__lt=${next.toISOString()}&username=davidguandev&format=json&api_key=` +
            this.apiKey,
          res => {
            let ret = "";
            res.on("data", d => {
              ret += d;
            });

            res.on("end", () => {
              const parsedRet = JSON.parse(ret);
              console.log(parsedRet);
            });
          }
        )
        .on("error", e => {
          console.error(e);
        });
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
