const sentry = require("@sentry/node");

const { ClistClient } = require("./src/contests-querier");
const { PersistentStore } = require("./src/data-store");
const { googleApiClient } = require("./src/google-api");
const { matchContest } = require("./src/helpers");
const { Logger } = require("./src/logger");

const { CLIST_KEY, SENTRY_ID } = process.env;
if (SENTRY_ID) {
  const sentryDsn = `https://${SENTRY_ID}@sentry.io/1443501`;
  sentry.init({ dsn: sentryDsn });
}
const logger = new Logger(SENTRY_ID ? sentry : undefined);
googleApiClient.init();

let users = [];
const usersStore = new PersistentStore("users");
usersStore.get().then(ret => {
  users = ret;
});

let events = [];
let eventsLoaded = false;
const eventsStore = new PersistentStore("events");
eventsStore.get().then(ret => {
  eventsLoaded = true;
  events = ret;
});

// An Observer who does the main work.
const contestsObserver = {
  update: ret => {
    if (!eventsLoaded) return;
    users.forEach(u => {
      const relatedEvents = events.filter(d => d.userEmail == u.email);
      ret
        .filter(d => matchContest(d, u))
        .forEach(d => {
          if (relatedEvents.find(e => e.contestId == d.id)) {
            console.log(`Already invited ${u.email} to ${d.event} :)`);
            return;
          }
          googleApiClient
            .invite({
              name: d.event,
              start: d.start,
              end: d.end,
              eventLink: d.href,
              email: u.email
            })
            .then(() => {
              events.push({
                userEmail: u.email,
                contestId: d.id
              });
              eventsStore.write(events);
            });
        });
    });
  }
};

const clistClient = new ClistClient(CLIST_KEY, logger);
clistClient.registerObserver(contestsObserver);
clistClient.startQuery(50000);
