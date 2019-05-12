class Logger {
  constructor(sentry) {
    this.sentry = sentry;
  }

  captureException(error) {
    if (this.sentry) {
      this.sentry.captureException(error);
    } else {
      console.error(error);
    }
  }

  captureMessage(msg) {
    if (this.sentry) {
      this.sentry.captureMessage(msg);
    } else {
      console.log(msg);
    }
  }
}

module.exports = {
  Logger
};
