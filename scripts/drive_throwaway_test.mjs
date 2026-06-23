// Throwaway write test (OAuth2 path) — proves the app can create a folder + the three
// workspace docs inside AEGIS_ROOT_FOLDER_ID, that they land on YOUR quota (owner = you,
// not the service account), then trashes everything. Touches no real data, needs no migration.
//   NODE_OPTIONS=--use-system-ca node scripts/drive_throwaway_test.mjs
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
if (!rootId) throw new Error("AEGIS_ROOT_FOLDER_ID not set.");

const auth = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

const WORKSPACE_FILES = [
  { name: "Project Report", mimeType: "application/vnd.google-apps.document" },
  { name: "Task Tracker", mimeType: "application/vnd.google-apps.spreadsheet" },
  { name: "Presentation", mimeType: "application/vnd.google-apps.presentation" },
];
const created = []; // {id, name} — for guaranteed cleanup

async function trashAll() {
  for (const item of created.reverse()) {
    try {
      await drive.files.update({ fileId: item.id, requestBody: { trashed: true } });
      console.log(`   🗑  trashed ${item.name} (${item.id})`);
    } catch (e) {
      console.log(`   ⚠  could NOT trash ${item.name} (${item.id}): ${e.message}`);
    }
  }
}

try {
  const me = await drive.about.get({ fields: "user(emailAddress)" });
  const myEmail = me.data.user?.emailAddress;
  console.log("✓ acting as:", myEmail);

  const folder = await drive.files.create({
    requestBody: {
      name: "AEGIS THROWAWAY TEST — safe to delete",
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootId],
    },
    fields: "id, name, owners(emailAddress), parents",
  });
  created.push({ id: folder.data.id, name: folder.data.name });
  console.log(`\n✓ created folder: ${folder.data.name}  (${folder.data.id})`);
  console.log(`   parent is root? ${folder.data.parents?.includes(rootId) ? "yes" : "NO"}`);
  console.log(`   owner (quota holder): ${folder.data.owners?.[0]?.emailAddress}`);

  for (const spec of WORKSPACE_FILES) {
    const f = await drive.files.create({
      requestBody: { name: spec.name, mimeType: spec.mimeType, parents: [folder.data.id] },
      fields: "id, name, mimeType, owners(emailAddress)",
    });
    created.push({ id: f.data.id, name: f.data.name });
    console.log(`✓ created: ${f.data.name}  [${f.data.mimeType}]  owner=${f.data.owners?.[0]?.emailAddress}`);
  }

  const list = await drive.files.list({
    q: `'${folder.data.id}' in parents and trashed = false`,
    fields: "files(id, name)",
  });
  console.log(`\n✓ folder now lists ${list.data.files?.length ?? 0} children (expected 3).`);

  const ownerEmail = folder.data.owners?.[0]?.emailAddress;
  console.log(
    ownerEmail && ownerEmail === myEmail
      ? `✓ QUOTA: files owned by YOU (${ownerEmail}) — correct; they use your 15 GB, not a 0-quota service account.`
      : `⚠ QUOTA: owner is ${ownerEmail}, not you — unexpected on the OAuth2 path.`,
  );
} catch (e) {
  console.error("✗ test failed:", e.message);
} finally {
  console.log("\n— cleanup —");
  await trashAll();
  console.log("✓ cleanup complete.");
}
