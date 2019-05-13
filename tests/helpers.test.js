const { matchContest } = require("../src/helpers");

describe("matchContest", () => {
  test("returns boolean based on the timing match", () => {
    const now = new Date();
    const contest = { start: now };

    const nowInUTCHour = now.getUTCHours();
    const userA = { start: nowInUTCHour, end: nowInUTCHour + 2 };
    expect(matchContest(contest, userA)).toBeTruthy();
    const userB = { start: nowInUTCHour + 1, end: nowInUTCHour + 2 };
    expect(matchContest(contest, userB)).toBeFalsy();

    const userC = { start: 23, end: 27 }; //toBeTruthy
    const crossDayCase = {
      start: new Date("December 1, 2000, 2:0:0 GMT+0:00")
    };
    expect(matchContest(crossDayCase, userC)).toBeTruthy();
  });
});
