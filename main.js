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

// Put stuff into run to get the async sugar.
async function run() {
  let createDataStoreImpl;
  // Try using mongo if possible, otherwise, the file system will be used as the data store.
  if (MONGO_CONNECTION_URL) {
    const mongoClient = new MongoClient(MONGO_CONNECTION_URL, {
      useNewUrlParser: true
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
        logger.captureException(e);
        process.exit();
      });
  }

  if (!createDataStoreImpl) {
    logger.captureMessage(
      "Because MONGO_CONNECTION_URL is not provided, file system will be used as storage"
    );
    createDataStoreImpl = name => new DataStoreFileImpl(name);
  }

  const usersStore = createDataStoreImpl("users");
  const users = await usersStore.getAll();
  const eventsStore = createDataStoreImpl("events");
  const events = await eventsStore.getAll();

  const subscribe = (contest, user) => {
    googleApiClient
      .invite({
        name: contest.event,
        start: contest.start,
        end: contest.end,
        eventLink: contest.href,
        email: user.email
      })
      .then(ret => {
        if (!ret.invited) return;
        const event = {
          userEmail: user.email,
          contestId: contest.id
        };

        events.push(event);
        eventsStore.append(event);
      });
  };

  const contestsObserver = {
    update: ret => {
      users.forEach(u => {
        const handledEvents = new Set();
        events.forEach(d => {
          if (d.userEmail != u.email) return;
          handledEvents.add(d.contestId);
        });

        const matchedContest = ret.filter(
          d => matchContest(d, u) && !handledEvents.has(d.id)
        );
        matchedContest.forEach(d => subscribe(d, u));
      });
    }
  };

  contestsSource.registerObserver(contestsObserver);
  contestsSource.startQuery(10 * 60 * 1000);
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
