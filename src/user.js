// TODO: provide implementation that support Mongo remote instance.
const { PersistentStore } = require("./data-store");

const assert = require("assert");

function validate(user) {
  assert(user.email !== undefined, "email is not provided to the user");
  assert(user.start !== undefined, "start time is not provided to the user");
  assert(user.start !== undefined, "end time is not provided to the user");
  assert(user.start < user.end, "start should be smaller than end");
}

async function getUsers() {
  const usersStore = new PersistentStore("users");
  let users = await usersStore.get();
  users.forEach(validate);
  return users;
}

module.exports = {
  getUsers
};
