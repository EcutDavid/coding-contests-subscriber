// https://developers.google.com/calendar/quickstart/nodejs
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

const { waitHalfSecond } = require("./helpers");

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

  init() {
    this.printMode = !fs.existsSync(CREDENTIAL_PATH);
    if (this.printMode) {
      return;
    }
    // Load client secrets from a local file.
    try {
      const content = fs.readFileSync(CREDENTIAL_PATH);
      // Authorize a client with credentials, then call the Google Calendar API.
      authorize(JSON.parse(content), ret => {
        this.authedClient = ret;
        this.calendar = google.calendar({ version: "v3", auth: ret });
      });
    } catch (err) {
      console.error("Error loading google client secret file:", err);
    }
  }

  async invite(config) {
    if (!this.calendar) {
      console.log("Google client not ready, retrying");
      setTimeout(() => this.invite(name, start, end), 1000);
      return;
    }

    // Seems Google API not very stable, so do it once a time.
    while (this.processing) {
      await waitHalfSecond(); // Currently, it's pretty okay to take a look again after 500 ms instead of 10 ms.
    }
    this.processing = true;
    const { name, start, end, email, eventLink } = config;

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
        (err, event) => {
          this.processing = false;
          if (err) {
            console.log(
              "There was an error contacting the Calendar service: " + err
            );
            reject(err);
          }
          console.log("invite sent :)");
          resolve(event);
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
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
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
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

module.exports = {
  googleApiClient: new GoogleApiClient()
};
