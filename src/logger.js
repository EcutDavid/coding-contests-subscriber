class Logger {
  constructor(sentry) {
    this.sentry = sentry;
  }

  captureException(error) {
    if (this.sentry) {
      this.sentry(error);
    } else {
      console.error();
    }
  }
}

module.exports = {
  Logger
};
