// Standalone Drive smoke test — authenticates via the OAuth2 refresh token and lists
// the app root folder's children. Mirrors lib/google/auth.ts (OAuth2 path).
//   NODE_OPTIONS=--use-system-ca node scripts/drive_smoke_test.mjs
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
loadEnv(".env.local");

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = process.env;
const rootId = process.env.AEGIS_ROOT_FOLDER_ID;
if (!GOOGLE_OAUTH_REFRESH_TOKEN) throw new Error("GOOGLE_OAUTH_REFRESH_TOKEN not set — run google_oauth_setup.mjs first.");
if (!rootId) throw new Error("AEGIS_ROOT_FOLDER_ID not set — google_oauth_setup.mjs writes it.");

const auth = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

const me = await drive.about.get({ fields: "user(emailAddress)" });
console.log("✓ acting as:", me.data.user?.emailAddress);

const res = await drive.files.list({
  q: `'${rootId}' in parents and trashed = false`,
  fields: "files(id, name, mimeType, modifiedTime)",
  pageSize: 100,
});
const files = res.data.files ?? [];
console.log(`✓ root folder ${rootId} has ${files.length} child item(s):`);
for (const f of files) console.log(`   • ${f.name}  [${f.mimeType}]  ${f.id}`);
if (files.length === 0) console.log("   (empty — fine; auth + folder access both work)");
