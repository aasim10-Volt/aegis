/** Typed client for the AEGIS FastAPI backend. Mirrors api/main.py response models. */

import { createClient } from "@/lib/supabase/client";

export interface SkillView {
  discipline: string;
  declared: number;
  confidence: number;
  adjusted: number;
  basis: string;
  corrected: boolean;
}

export interface StudentProfile {
  student_id: string;
  name: string;
  skills: SkillView[];
  team_id: string | null;
  project_id: string | null;
  fit: number | null;
  rationale: string;
}

export interface MemberView {
  student_id: string;
  name: string;
  utilisation: number | null;
  overloaded: boolean;
}

export interface TeamView {
  team_id: string;
  project_id: string;
  project_title: string;
  members: MemberView[];
  health_score: number;
  band: string;
  components: Record<string, number>;
  unallocated_hours: number;
}

export interface AlertView {
  severity: string;
  trigger_type: string;
  detail: string;
  team_id: string | null;
  student_id: string | null;
}

export interface DuplicateView {
  project_a: string;
  project_b: string;
  similarity: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  hint: string;
}

export interface RunResponse {
  stages: PipelineStage[];
  teams: TeamView[];
  alerts: AlertView[];
  duplicate_flags: DuplicateView[];
  exception_pool: string[];
  student_profiles: StudentProfile[];
}

export interface AuditView {
  id: number;
  actor_id: string;
  actor_role: string;
  action: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  row_hash: string | null;
}

export interface ApprovalView {
  request_id: string;
  full_name: string;
  email: string;
  role_requested: string;
  requested_at: string;
}

export interface OverrideView {
  team_id: string;
  lecturer: string;
  from_status: string;
  to_status: string;
  reason: string;
  at: string;
}

export interface IntegrityView {
  verified: boolean;
  broken_at: number | null;
  entries: number;
}

/**
 * Base URL for the FastAPI backend.
 * NEXT_PUBLIC_API_URL always wins (set in .env.production for Railway).
 * Falls back to same-host :8000 in the browser (local dev / LAN) or
 * localhost:8000 server-side (SSR / build).
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export const API_URL = API_BASE;

/**
 * Authorization header for /admin/* calls: the logged-in USER's Supabase access
 * token (JWT), read client-side from the browser session. This is the anon-key
 * user session — NEVER the service_role key, which must never reach the browser.
 * The backend (require_admin) verifies the token and checks profiles.role='admin'.
 * No session → no header → the backend returns 401, surfaced to the panel.
 */
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJSON<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: await authHeader() });
  } catch {
    throw new Error(`Could not reach the AEGIS API at ${API_URL}. Is it running (uvicorn)?`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("You must be signed in as an admin to view Governance.");
  }
  if (!res.ok) throw new Error(`${path} failed (${res.status}).`);
  return res.json() as Promise<T>;
}

export const getAudit = () => getJSON<AuditView[]>("/admin/audit");
export const getApprovals = () => getJSON<ApprovalView[]>("/admin/approvals");
export const getOverrides = () => getJSON<OverrideView[]>("/admin/overrides");
export const getIntegrity = () => getJSON<IntegrityView>("/admin/integrity");

/** Approve or reject a pending account (admin action). */
export async function decideApproval(id: string, action: "approve" | "reject"): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ action }),
    });
  } catch {
    throw new Error(`Could not reach the AEGIS API at ${API_URL}.`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("You must be signed in as an admin to approve or reject accounts.");
  }
  if (!res.ok) throw new Error(`Could not ${action} that request (${res.status}).`);
}

function isRunResponse(v: unknown): v is RunResponse {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    Array.isArray(o.stages) &&
    Array.isArray(o.teams) &&
    Array.isArray(o.alerts) &&
    Array.isArray(o.duplicate_flags) &&
    Array.isArray(o.exception_pool) &&
    Array.isArray(o.student_profiles)
  );
}

export async function runPipeline(): Promise<RunResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/run`, { method: "POST" });
  } catch {
    throw new Error(`Could not reach the AEGIS API at ${API_URL}. Is it running (uvicorn) and is this origin allowed by CORS?`);
  }
  if (!res.ok) {
    throw new Error(`Run failed (${res.status}). Is the AEGIS API running on ${API_URL}?`);
  }
  const body: unknown = await res.json();
  if (!isRunResponse(body)) {
    throw new Error("Unexpected response shape from /run — the API contract may have drifted.");
  }
  return body;
}
