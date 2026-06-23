import { getDriveClient } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** The standard workspace AEGIS provisions per team. Mirrors §4 of the
 *  Integration Setup Guide: a Doc, a Sheet, and a Slides deck inside one folder. */
const WORKSPACE_FILES = [
  { name: "Project Report", mimeType: "application/vnd.google-apps.document" },
  { name: "Task Tracker", mimeType: "application/vnd.google-apps.spreadsheet" },
  { name: "Presentation", mimeType: "application/vnd.google-apps.presentation" },
] as const;

export type ProvisionedWorkspace = {
  folderId: string;
  files: { name: string; fileId: string }[];
};

/** Create a team's Drive workspace and grant each member write access.
 *  Runs ONCE per team at allocation time (see allocation write-back, commit 289176d).
 *
 *  ⚠️ Storage gotcha (Guide §4): the service account has zero Drive quota. Files MUST be
 *  created inside AEGIS_ROOT_FOLDER_ID — a folder shared from a real Google account with
 *  the service account as Editor. Creating outside that parent will fail with a quota error.
 *
 *  Persists folderId onto teams.drive_folder_id (migration 0005). */
export async function provisionTeamWorkspace(
  teamId: string,
  memberEmails: string[],
): Promise<ProvisionedWorkspace> {
  const parentFolderId = process.env.AEGIS_ROOT_FOLDER_ID;
  if (!parentFolderId) {
    throw new Error("provisionTeamWorkspace: AEGIS_ROOT_FOLDER_ID is not set.");
  }
  const drive = getDriveClient();

  const folder = await drive.files.create({
    requestBody: {
      name: `Team ${teamId}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });
  const folderId = folder.data.id;
  if (!folderId) throw new Error("provisionTeamWorkspace: Drive returned no folder id.");

  const files = await Promise.all(
    WORKSPACE_FILES.map(async (spec) => {
      const file = await drive.files.create({
        requestBody: { name: spec.name, mimeType: spec.mimeType, parents: [folderId] },
        fields: "id",
      });
      return { name: spec.name, fileId: file.data.id! };
    }),
  );

  // Grant members write access on the folder; permissions cascade to the files inside.
  // sendNotificationEmail:false — students discover the workspace through the AEGIS UI, not email.
  for (const email of memberEmails) {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: { type: "user", role: "writer", emailAddress: email },
      sendNotificationEmail: false,
    });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("teams")
    .update({ drive_folder_id: folderId })
    .eq("id", teamId);
  if (error) throw new Error(`provisionTeamWorkspace: failed to persist folder id — ${error.message}`);

  return { folderId, files };
}
