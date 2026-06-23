// One-time OAuth2 consent capture. Run ONCE to mint a refresh token so AEGIS can act
// AS your Google account (files owned by you, on your quota — the consumer-Gmail path).
//   NODE_OPTIONS=--use-system-ca node scripts/google_oauth_setup.mjs
//
// Prereqs (Guide §4, OAuth2 path):
//   - An OAuth client ID of type "Desktop app" in Google Cloud Console.
//   - GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET set in .env.
//   - Yourself added as a Test user on the OAuth consent screen.
//
// Scopes requested (narrowest that cover provisioning + monitoring):
//   - https://www.googleapis.com/auth/drive.file            (only files the app creates)
//   - https://www.googleapis.com/auth/drive.activity.readonly (read edit activity on them)
//
// On success it writes two values straight into .env (the refresh token is NEVER printed
// or logged — treat it like the service_role key):
//   GOOGLE_OAUTH_REFRESH_TOKEN=...   (SECRET)
//   AEGIS_ROOT_FOLDER_ID=...         (the app-created parent — drive.file can only use folders it made)
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { google } from "googleapis";

const ENV_PATH = ".env";

function parseEnvFile(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

/** Upsert keys into .env in place, preserving existing lines/comments. */
function writeEnv(path, updates) {
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {}
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
    text = re.test(text) ? text.replace(re, line) : text.replace(/\n*$/, "\n") + line + "\n";
  }
  writeFileSync(path, text);
}

const env = { ...parseEnvFile(ENV_PATH), ...process.env };
const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
if (!clientId || !clientSecret || clientId.startsWith("YOUR_")) {
  throw new Error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env first.");
}

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.activity.readonly",
];

const PORT = 53682; // loopback redirect — Desktop-app clients allow any localhost port
const redirectUri = `http://localhost:${PORT}`;
const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline", // required to receive a refresh token
  prompt: "consent", // force a refresh token even on re-auth
  scope: SCOPES,
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code in callback.");
    return;
  }
  try {
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      res.writeHead(200).end("No refresh token returned — see terminal.");
      console.log(
        "\n⚠ No refresh_token returned. Revoke AEGIS at https://myaccount.google.com/permissions " +
          "and re-run (Google only sends it on the FIRST consent).",
      );
      return;
    }
    oauth2.setCredentials(tokens);

    // Create the app-owned root folder. Under drive.file the app can only place files in
    // folders IT created — so we make one here and record its id. Owned by you = your quota.
    const drive = google.drive({ version: "v3", auth: oauth2 });
    const folder = await drive.files.create({
      requestBody: { name: "AEGIS Team Workspaces", mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });

    writeEnv(ENV_PATH, {
      GOOGLE_OAUTH_REFRESH_TOKEN: tokens.refresh_token,
      AEGIS_ROOT_FOLDER_ID: folder.data.id,
    });

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>AEGIS: authorized ✓</h2><p>Secrets written to .env. You can close this tab.</p>");
    console.log("\n✓ Authorized with scopes: drive.file + drive.activity.readonly");
    console.log("✓ Refresh token written to .env (value not shown — treat as a secret).");
    console.log(`✓ Created app root folder; AEGIS_ROOT_FOLDER_ID=${folder.data.id} written to .env.`);
    console.log("\nDone. You can delete this terminal's scrollback if you like — nothing secret was printed.");
  } catch (e) {
    res.writeHead(500).end("Setup failed: " + e.message);
    console.error("✗ setup failed:", e.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in your browser to authorize AEGIS:\n");
  console.log(authUrl + "\n");
  console.log(`(waiting for the redirect to ${redirectUri} …)`);
});
