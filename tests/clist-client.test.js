const { ClistClient } = require("../src/clist-client");

let httpsClient;
let logger;
let clistClient;
const START_DATE = new Date();
const END_DATE = new Date(new Date().getTime() + 1000 * 5);

beforeEach(() => {
  const httpsGet = jest.fn();
  httpsGet.mockReturnValue({ on: jest.fn() });
  httpsClient = { get: httpsGet };
  logger = { captureException: jest.fn() };
  clistClient = new ClistClient("apiKey", "userName", logger, httpsClient);
});

describe("query", () => {
  test("calls https client's get", () => {
    expect(httpsClient.get).not.toBeCalled();
    clistClient.query(START_DATE, END_DATE);
    expect(httpsClient.get).toBeCalled();
  });

  test("calls logger's captureException when there is error", () => {
    let errorCallback;
    const getRet = {
      on: (name, cb) => {
        // Hey, how do you know the internal implementation?
        // - I think it's okay here to have an assumption that the impl handles the error,
        //   might be wrong for sure.
        if (name == "error") errorCallback = cb;
      }
    };
    httpsClient = {
      get: () => getRet
    };
    clistClient = new ClistClient("apiKey", "userName", logger, httpsClient);
    clistClient.query(START_DATE, END_DATE);
    expect(errorCallback).toBeDefined();
    const error = new Error("errorMsg");
    errorCallback(error);
    expect(logger.captureException).toBeCalledWith(error);
  });
});
