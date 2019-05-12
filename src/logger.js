class Logger {
  constructor(sentry) {
    this.sentry = sentry;
  }

  captureException(error) {
    console.error(error);
    if (this.sentry) {
      this.sentry.captureException(error);
    }
  }

  captureMessage(msg) {
    console.log(msg);
    if (this.sentry) {
      this.sentry.captureMessage(msg);
    }
  }
}

module.exports = {
  Logger
};
