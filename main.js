const sentry = require("@sentry/node");

const { ClistClient } = require("./src/contests-querier");
const { PersistentStore } = require("./src/data-store");
const { googleApiClient } = require("./src/google-api");
const { matchContest } = require("./src/helpers");
const { Logger } = require("./src/logger");
const { getUsers } = require("./src/user");

const { CLIST_KEY, SENTRY_ID } = process.env;

async function run() {
  if (SENTRY_ID) {
    const sentryDsn = `https://${SENTRY_ID}@sentry.io/1443501`;
    sentry.init({ dsn: sentryDsn });
  }
  const logger = new Logger(SENTRY_ID ? sentry : undefined);
  const clistClient = new ClistClient(CLIST_KEY, logger);
  googleApiClient.init();

  const users = await getUsers();
  const eventsStore = new PersistentStore("events");
  const events = await eventsStore.get();

  // An Observer who does the main work.
  const contestsObserver = {
    update: ret => {
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

  clistClient.registerObserver(contestsObserver);
  clistClient.startQuery(50000);
}

run();
