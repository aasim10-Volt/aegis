import { google } from "googleapis";

/** Narrowest scopes that cover provisioning + activity. Google grants exactly these.
 *  - drive.file              : per-file access — the app can ONLY touch files it created
 *                              (or that were explicitly opened with it). It canNOT read the
 *                              rest of the user's Drive. This is why AEGIS creates its OWN
 *                              root folder (see google_oauth_setup.mjs) rather than reusing a
 *                              pre-existing folder it didn't make.
 *  - drive.activity.readonly : read who-edited-what on those files (the monitoring feed).
 *  NOT requested: full `drive` (would expose the whole account) and `documents` (only needed
 *  to edit Doc *content* via API — AEGIS embeds via iframe, so it isn't required). */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.activity.readonly",
];

/** Pick the auth strategy from the environment:
 *  - OAuth2 user credentials (refresh token) → the app acts AS a real Google account, so
 *    created files are owned by that account and use ITS quota. Required on consumer Gmail,
 *    where a service account can't own files (0-byte quota → "storage quota exceeded").
 *    See Guide §4 (corrected) and scripts/google_oauth_setup.mjs.
 *  - Service account (JSON key) → only viable with Workspace + a Shared Drive / delegation.
 *  OAuth2 wins when its env is present. SERVER ONLY. */
export function getGoogleAuth() {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } =
    process.env;

  if (GOOGLE_OAUTH_REFRESH_TOKEN) {
    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
      throw new Error(
        "getGoogleAuth: GOOGLE_OAUTH_REFRESH_TOKEN is set but GOOGLE_OAUTH_CLIENT_ID/SECRET are missing.",
      );
    }
    const oauth2 = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
    return oauth2;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Service-account path — only owns files via a Shared Drive (Workspace). On consumer
    // Gmail this WILL fail on file creation; use the OAuth2 path above instead.
    return new google.auth.GoogleAuth({ scopes: GOOGLE_SCOPES });
  }

  throw new Error(
    "getGoogleAuth: no credentials. Set GOOGLE_OAUTH_REFRESH_TOKEN (+ CLIENT_ID/SECRET) for the " +
      "consumer-Gmail path, or GOOGLE_APPLICATION_CREDENTIALS for the Workspace/Shared-Drive path.",
  );
}

/** Drive v3 client (provisioning + permissions). */
export function getDriveClient() {
  return google.drive({ version: "v3", auth: getGoogleAuth() });
}

/** Drive Activity v2 client (the read side — feeds engagement_signal_rate). */
export function getActivityClient() {
  return google.driveactivity({ version: "v2", auth: getGoogleAuth() });
}
