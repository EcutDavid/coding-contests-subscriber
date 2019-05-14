const MS_DAY = 1000 * 60 * 60 * 24;

class ContestsSource {
  constructor(clistClient, logger) {
    this.clistClient = clistClient;
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
    this.logger.captureMessage("Starting a new round of query");
    const now = new Date();
    const next = new Date(new Date().getTime() + MS_DAY * days);
    this.clistClient.query(now, next, ret => {
      this.contests = ret;
      this.notifyObservers();
    });
  }

  notifyObservers() {
    for (const obs of this.observers) {
      if (obs.update) {
        obs.update(this.contests);
      }
    }
  }

  startQuery(interval = 1000, days = 14) {
    this.query(days);
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
  ContestsSource
};
