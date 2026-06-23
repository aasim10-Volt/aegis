// Diagnostic: what scopes did the stored refresh token actually grant?
// Prints the granted scopes (not secret) so we can confirm drive.file (narrow) vs drive (full).
//   NODE_OPTIONS=--use-system-ca node scripts/drive_check_scopes.mjs
import { readFileSync } from "node:fs";
import { google } from "googleapis";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const val = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch {}
}
loadEnv(".env");

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = process.env;
const auth = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });

const { token } = await auth.getAccessToken();
const info = await auth.getTokenInfo(token);
console.log("granted scopes:");
for (const s of info.scopes ?? []) console.log("   •", s);
const hasNarrow = info.scopes?.includes("https://www.googleapis.com/auth/drive.file");
const hasFull = info.scopes?.includes("https://www.googleapis.com/auth/drive");
console.log(
  hasFull
    ? "\n→ FULL `drive` scope present — over-scoped. Re-mint with the narrow consent script."
    : hasNarrow
      ? "\n→ Narrow `drive.file` present — good. Needs an APP-CREATED root folder."
      : "\n→ No Drive scope found — unexpected.",
);
