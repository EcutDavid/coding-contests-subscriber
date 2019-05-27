const fs = require("fs");
const fsPromises = require("fs").promises;

const { waitFiveMs } = require("./helpers");

// A simple file-based data store.
class DataStoreFileImpl {
  constructor(name) {
    this.fileName = `data-store-${name}.json`;
    this.processing = false;

    const exists = fs.existsSync(this.fileName);
    if (!exists) {
      fs.writeFileSync(this.fileName, "[]");
    }
  }

  // TODO: error handling.
  async getAll() {
    while (this.processing) {
      await waitFiveMs();
    }
    this.processing = true;
    const rawDocument = await fsPromises.readFile(this.fileName);
    const rows = JSON.parse(rawDocument);
    this.processing = false;
    return rows;
  }

  async append(row) {
    while (this.processing) {
      await waitFiveMs();
    }
    this.processing = true;
    const content = JSON.parse(await fsPromises.readFile(this.fileName));
    content.push(row);
    await fsPromises.writeFile(this.fileName, JSON.stringify(content));
    this.processing = false;
    return;
  }
}

class DataStoreMongoImpl {
  constructor(name, mongoDb) {
    this.collection = mongoDb.collection(name);

    this.processing = false;
  }

  async getAll() {
    while (this.processing) {
      await waitFiveMs();
    }
    this.processing = true;
    const ret = await this.collection.find().toArray();
    this.processing = false;
    return ret;
  }

  async append(row) {
    while (this.processing) {
      await waitFiveMs();
    }
    this.processing = true;
    await this.collection.insertOne(row);
    this.processing = false;
  }
}

module.exports = {
  DataStoreFileImpl,
  DataStoreMongoImpl
};
