const readline = require("readline");

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    })
  );
}

function matchContest(contest, user) {
  let startTimeInUTC = new Date(contest.start).getUTCHours();
  // Handle the case that a user's timing being normalized to "cross day".
  if (user.end >= 24) {
    startTimeInUTC += 24;
  }
  return startTimeInUTC >= user.start && startTimeInUTC <= user.end;
}

async function waitHalfSecond() {
  return new Promise(res => {
    setTimeout(() => res(), 500);
  });
}

const ADD_USER_PROMPT = "Add a new user?(Y/N): ";
const USER_EMAIL_PROMPT = "Email: ";
const USER_START_PROMPT = "Preferred earliest start hour(0 - 23, integer): ";
const USER_END_PROMPT = "Preferred latest start hour(0 - 23, integer): ";
const USER_TIME_ZONE_PROMPT = "Timezone in UTC(-12 - 12): ";

async function maybeAddSomeUsers(users, usersStore, logger) {
  let prompt = `There are ${users.length} users in data store right now.`;
  for (let i = 1; i <= users.length; i++) {
    prompt += `\n${i}: ${users[i - 1].email}`;
  }
  logger.captureMessage(prompt);
  let ret = await askQuestion(ADD_USER_PROMPT);
  while (ret == "y") {
    let user = {};
    ret = await askQuestion(USER_EMAIL_PROMPT);
    // Not checking email syntax for now.
    if (ret == "") {
      logger.captureException("Email cannot be empty");
      process.exit();
    }
    user.email = ret;
    ret = await askQuestion(USER_START_PROMPT);
    user.start = Number.parseInt(ret);
    ret = await askQuestion(USER_END_PROMPT);
    user.end = Number.parseInt(ret);
    ret = await askQuestion(USER_TIME_ZONE_PROMPT);
    const timeZone = Number.parseInt(ret);

    for (const num of [users.start, users.end, timeZone]) {
      // Not checking other criteria for now.
      if (!Number.isNaN(num)) continue;
      logger.captureException("Parsing start/end time failed");
      process.exit();
    }

    user.start -= timeZone;
    user.end -= timeZone;
    if (user.start < 0) {
      user.start += 24;
      user.end += 24;
    }
    logger.captureMessage(`Adding user ${JSON.stringify(user)}`);
    await usersStore.append(user);
    users.push(user);

    ret = await askQuestion(ADD_USER_PROMPT);
  }
}

module.exports = {
  maybeAddSomeUsers,
  matchContest,
  waitHalfSecond
};
