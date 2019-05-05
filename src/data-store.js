const fs = require("fs");
const fsPromises = require("fs").promises;

const { waitHalfSecond } = require("./helpers");

// One simple data store
class PersistentStore {
  constructor(name) {
    this.fileName = `data-store-${name}.json`;
    this.processing = false;

    const exists = fs.existsSync(this.fileName);
    if (!exists) {
      fs.writeFileSync(this.fileName, "{}");
    }
  }

  // TODO: error handling.
  async get(condition) {
    while (this.processing) {
      await waitHalfSecond(); // Currently, it's pretty okay to take a look again after 500 ms instead of 10 ms.
    }
    this.processing = true;
    const rawDocument = await fsPromises.readFile(this.fileName);
    const document = JSON.parse(rawDocument);
    const ret = document.filter(row => !condition || condition(row));
    this.processing = false;
    return ret;
  }

  async write(content) {
    while (this.processing) {
      await waitHalfSecond();
    }
    this.processing = true;
    await fsPromises.writeFile(this.fileName, JSON.stringify(content));
    this.processing = false;
    return;
  }
}

module.exports = {
  PersistentStore
};
