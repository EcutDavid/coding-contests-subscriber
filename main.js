const https = require("https");
const MongoClient = require("mongodb").MongoClient;
const sentry = require("@sentry/node");

const { ClistClient } = require("./src/clist-client");
const { ContestsSource } = require("./src/contests-source");
const { DataStoreFileImpl, DataStoreMongoImpl } = require("./src/data-store");
const { googleApiClient } = require("./src/google-api");
const { matchContest } = require("./src/helpers");
const { Logger } = require("./src/logger");

const {
  CLIST_KEY,
  CLIST_USER_NAME,
  MONGO_CONNECTION_URL,
  MONGO_DB_NAME,
  SENTRY_DSN
} = process.env;
const cleanUpTasks = [];

if (SENTRY_DSN) {
  sentry.init({ dsn: SENTRY_DSN });
}
const logger = new Logger(SENTRY_DSN ? sentry : undefined);
const clistClient = new ClistClient(CLIST_KEY, CLIST_USER_NAME, logger, https);
const contestsSource = new ContestsSource(clistClient);
googleApiClient.init(logger);
let createDataStoreImpl;

async function run() {
  if (MONGO_CONNECTION_URL) {
    const mongoClient = new MongoClient(MONGO_CONNECTION_URL, {
      useNewUrlParser: true // Old one is going to be deprecated.
    });
    await mongoClient
      .connect()
      .then(() => {
        const mongoDb = mongoClient.db(
          MONGO_DB_NAME ? MONGO_DB_NAME : "contests-sub"
        );
        createDataStoreImpl = name => {
          return new DataStoreMongoImpl(name, mongoDb);
        };
        cleanUpTasks.push(() => mongoClient.close());
      })
      .catch(e => {
        console.error(e);
        process.exit();
      });
  }

  if (!createDataStoreImpl) {
    console.log(
      "Because MONGO_CONNECTION_URL is not provided, file system will be used as storage"
    );
    createDataStoreImpl = name => new DataStoreFileImpl(name);
  }

  const usersStore = createDataStoreImpl("users");
  const users = await usersStore.getAll();
  const eventsStore = createDataStoreImpl("events");
  const events = await eventsStore.getAll();

  // An Observer who does the main work.
  const contestsObserver = {
    update: ret => {
      users.forEach(u => {
        const relatedEvents = events.filter(d => d.userEmail == u.email);
        const matchedContest = ret.filter(d => matchContest(d, u));
        matchedContest.forEach(d => {
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
              const event = {
                userEmail: u.email,
                contestId: d.id
              };

              events.push(event);
              eventsStore.append(event);
            });
        });
      });
    }
  };

  contestsSource.registerObserver(contestsObserver);
  contestsSource.startQuery(55000);
}
run();

function cleanupProcess() {
  while (cleanUpTasks.length) {
    cleanUpTasks.pop()();
  }
  process.exit();
}
process.on("exit", cleanupProcess);
process.on("SIGINT", cleanupProcess);
process.on("SIGUSR1", cleanupProcess);
process.on("SIGUSR2", cleanupProcess);
