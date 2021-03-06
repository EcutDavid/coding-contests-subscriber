// https://developers.google.com/calendar/quickstart/nodejs
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

const { waitFiveMs } = require("./helpers");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";
const CREDENTIAL_PATH = "google-credentials.json";

class GoogleApiClient {
  constructor() {
    this.calendar = undefined;
    this.authedClient = undefined;
    this.processing = false;

    this.printMode = true;
  }

  init(logger) {
    this.printMode = !fs.existsSync(CREDENTIAL_PATH);
    this.logger = logger;
    if (this.printMode) {
      logger.captureMessage(
        `Because ${CREDENTIAL_PATH} is not found, the contests will just be printed instead of being used for sending calendar events.`
      );
      return;
    }
    // Load client secrets from a local file.
    try {
      const content = fs.readFileSync(CREDENTIAL_PATH);
      // Authorize a client with credentials, then call the Google Calendar API.
      authorize(JSON.parse(content), logger, ret => {
        this.authedClient = ret;
        this.calendar = google.calendar({ version: "v3", auth: ret });
      });
    } catch (err) {
      logger.captureException(err);
    }
  }

  async invite(config) {
    // Seems Google API not very stable, so do it once a time.
    while (this.processing) {
      await waitFiveMs();
    }
    const { name, start, end, email, eventLink } = config;

    if (this.printMode) {
      this.logger.captureMessage(
        `Contest ${name}, ${eventLink} is friendly to ${email}`
      );
      return Promise.resolve();
    }

    this.processing = true;
    const event = {
      summary: name,
      description: eventLink,
      start: {
        dateTime: start
      },
      end: {
        dateTime: end
      },
      attendees: [{ email }],
      reminders: {
        useDefault: false,
        overrides: [{ method: "email", minutes: 24 * 60 }] // TODO: better reminder timing.
      }
    };

    return new Promise((resolve, reject) => {
      this.calendar.events.insert(
        {
          auth: this.authedClient,
          calendarId: "primary",
          resource: event
        },
        (err, ret) => {
          this.processing = false;
          if (err) {
            this.logger.captureException(
              "There was an error contacting the Calendar service: " + err
            );
            return reject(err);
          }
          this.logger.captureMessage(
            `Invitation about contest ${name} is sent to ${email}`
          );
          resolve({ invited: true });
        }
      );
    });
  }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, logger, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, logger, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, logger, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  logger.captureMessage("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return logger.captureException("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return logger.captureException(err);
        logger.captureMessage("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

module.exports = {
  googleApiClient: new GoogleApiClient()
};
