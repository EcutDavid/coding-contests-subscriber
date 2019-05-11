// https://clist.by/
// Contest format:
// {
//   duration: seconds,
//   end: ISO UTC time,
//   event: contest name,
//   href: URL,
//   id: string,
//   resource: does not matter,
//   start: ISO UTC time
// }
class ClistClient {
  constructor(apiKey, userName, logger, httpsClient) {
    this.userName = userName;
    this.apiKey = apiKey;
    this.logger = logger;

    this.httpsClient = httpsClient;
  }

  query(startDate, endDate, cb) {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    this.httpsClient
      .get(
        {
          hostname: "clist.by",
          path: `/api/v1/contest/?limit=1000&start__gt=${start}&start__lt=${end}&format=json&username=${
            this.userName
          }&api_key=${this.apiKey}`
        },
        res => {
          let ret = "";
          res.on("data", d => {
            ret += d;
          });

          res.on("end", () => {
            try {
              const parsedRet = JSON.parse(ret);
              parsedRet.objects.forEach(d => {
                // Normalize the date to ISO format.
                d.start += "+00:00";
                d.end += "+00:00";
              });
              cb(parsedRet.objects);
            } catch (e) {
              this.logger.captureException(e);
              return;
            }
          });
        }
      )
      .on("error", e => {
        this.logger.captureException(e);
      });
  }
}

module.exports = {
  ClistClient
};
