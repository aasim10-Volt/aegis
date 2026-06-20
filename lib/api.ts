/** Typed client for the AEGIS FastAPI backend. Mirrors api/main.py response models. */

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

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
