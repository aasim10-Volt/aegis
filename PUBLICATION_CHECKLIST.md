# AEGIS — Publication / Repo-Publish Readiness Checklist

**Prepared:** 2026-06-22 · **Submission deadline:** 2026-06-26 10:00
**Scope:** verifies the repository is safe to make public for CIPHER 2.0 submission.

---

## 1. Secret hygiene — what's gitignored

All secret-bearing paths are confirmed ignored via `git check-ignore` (✓ = ignored):

| Path | Status |
|---|---|
| `.env` | ✓ ignored |
| `.env.local` | ✓ ignored |
| `.env.*` (e.g. `.env.production`) | ✓ ignored |
| `secrets/` | ✓ ignored |
| `service-account*.json` | ✓ ignored |
| `.claude.json` | ✓ ignored (added 2026-06-22) |
| `.mcp.json` | ✓ ignored (added 2026-06-22) |

Notes:
- `.mcp.json` and `.claude.json` were **never tracked** (verified with `git ls-files`); `.mcp.json`
  contains only the public `shadcn` MCP server entry — no secrets — and is now ignored regardless.
- `.env.example` is intentionally **committed** (placeholders only) and whitelisted via `!.env.example`.
- The live service-account JSON sits in `secrets/` (ignored). It is being **rotated/deleted on the
  owner's side** as part of this gate (the `service_role` key rotation + unused SA key deletion).

## 2. Clean-history evidence

Full-history secret sweep across **all branches and all commits**:

```
git log --all -p | grep -iE "eyJhbGciOiJ|BEGIN PRIVATE KEY|GOCSPX-|postgresql://postgres"
```

Patterns mean: Supabase/JWT keys (`eyJhbGciOiJ`), PEM private keys, Google OAuth client
secrets (`GOCSPX-`), and Postgres connection strings.

**Result: no real secrets in history.** The only raw hit is a documentation line in
`SECURITY_REVIEW.md` that *quotes the grep pattern itself* (`...BEGIN PRIVATE KEY|supabase.*key`).
Re-running per-pattern over added lines with documentation excluded returns **clean** for all four:

```
eyJhbGciOiJ        → (clean)
BEGIN PRIVATE KEY  → (clean — only the SECURITY_REVIEW.md grep example, and the gitignored secrets/ file)
GOCSPX-            → (clean)
postgresql://postgres → (clean)
```

`BEGIN PRIVATE KEY` exists on disk only in `secrets/service-account.json` (gitignored, never
committed) and as the documented pattern string in `SECURITY_REVIEW.md`.

## 3. All data is synthetic — no real PII

Every dataset **committed to the repository** is fabricated. Verified against tracked files only
(`git ls-files`); the loose working-tree exports (`student_profiles.json`,
`student_profiles_flat.csv`, `lms_raw_export.csv`, `module_skill_mapping.csv`) are **untracked**
and not part of the published repo.

- **Tracked seed data** (`aegis/seed/seed.json`, `lib/sample-run.ts`): 12 engineered demo students
  with an obviously synthetic **A–L alphabetical** name sequence (Aisha Rahman, Bilal Khan, Chen Wei,
  Devi Menon, …, Lena Costa).
- **Emails** use the reserved, non-resolving **`@aegis.test`** domain (RFC 2606). No deliverable
  addresses.
- **Student IDs** are sequential synthetic (`STU_01`…`STU_12`). The 70-student `STU_88xxx` cohort
  appears only in untracked working files and as a reference in `docs/AEGIS_README_v3.md` — it is
  **not committed as data**.
- **Email-pattern scan of all tracked files** surfaced only: `@aegis.test` (synthetic),
  `you@university.edu` / `you@iit.ac.lk` (UI/HTML **placeholder** text), `a@x.test` (test fixture),
  and `i@izs.me` (a dependency author address in `pnpm-lock.yaml`). **No real student PII.**

> **Statement:** All personal data in this repository is synthetic and was generated for
> demonstration. It does not correspond to any real individual.

## 4. License status

- **MIT License** present and **tracked** (`LICENSE`).
- Copyright: *© 2026 AEGIS — Team Amateurs, Informatics Institute of Technology.*
- MIT is permissive and appropriate for an open prototype submission.

---

## Owner action items (outside this gate)
- [ ] Rotate the exposed Supabase `service_role` key.
- [ ] Delete the unused service-account key in Google Cloud.
- [ ] (Optional) Delete the old manually-shared Drive folder `1LwB7X…` and revoke SA access.
