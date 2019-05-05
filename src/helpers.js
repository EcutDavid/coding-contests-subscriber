function matchContest(contest, user) {
  const startTimeInUTC = new Date(contest.start).getUTCHours();
  return startTimeInUTC >= user.start && startTimeInUTC <= user.end;
}

async function waitHalfSecond() {
  return new Promise(res => {
    setTimeout(() => res(), 500);
  });
}

module.exports = {
  matchContest,
  waitHalfSecond
};
