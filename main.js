const { ClistClient } = require("./contests-querier");
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: "https://9302735370094c88af3704e13a9216a0@sentry.io/1443164"
});
// Sentry.captureException(new Error("Hello Sentry"));
// Sentry.captureMessage("Hello David");
const clistClient = new ClistClient(process.env.CLIST_KEY);
clistClient.startQuery(5000);
