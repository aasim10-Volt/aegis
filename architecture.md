# Architecture

This document explains how AEGIS is designed. The prototype demonstrates the experience. This is the plan for the system behind it.

## Overview

AEGIS has three jobs:

1. Build balanced project teams from evidence rather than self-report.
2. Match students to teams and roles in a way that respects everyone's preferences.
3. Watch each team through the semester and surface problems early, while leaving the final call to a human.

The product is split by role. Students, faculty, and admins each see only what is relevant to them, backed by the same data and the same engine.

## Roles and access

- Students see their own profile, tasks, team health, and placement reasoning. They can appeal a placement.
- Faculty see the teams they supervise, an alert inbox, and the team formation tools. They review anything the system flags before it becomes a decision.
- Admins manage users, cohorts, scoring weights, monitoring thresholds, and service health.

Access is enforced at the data layer. A student can only read their own records. A lecturer can only read records for their assigned cohorts.

## The engine

Team formation runs in four stages. Each stage hands a clear result to the next.

### 1. Evidence-weighted scoring

A declared skill is multiplied by a confidence factor based on how well it can be backed up.

```
Adjusted score = Declared score x Confidence
```

Confidence values:

- 1.0 for a verified grade
- 0.8 for a portfolio item
- 0.6 for self-report with no evidence
- 0.5 when throughput contradicts the claim

This stops a confident self-rating from outweighing real evidence.

### 2. Stable preference matching

Students and projects both express preferences. The system uses a stable matching approach (the Abraham and Manlove student-project allocation method) so the result has no pair who would both rather be matched to each other than to their current assignment.

### 3. Maximin team formation

Rather than maximising the average team, the objective lifts the weakest team. The aim is that no group is left far behind, which is the fairness goal at the centre of the product.

### 4. Health monitoring

After teams form, the system polls workspace activity on a regular cycle and watches for trouble:

- Ghosting, tracked in tiers by how long a student has been silent
- Sympathy carry, when one member is doing far more than their share
- Burnout, when one member is working far above the team average
- Duplicate ideas, caught by comparing project abstracts before teams are locked

A flag is a prompt for a lecturer, not an automatic penalty.

## Governance and privacy

AEGIS is built around Sri Lanka's PDPA No. 9 of 2022.

- Consent is collected at onboarding, and the consent screen states exactly what is monitored.
- Only activity metadata is read. Document contents are never read.
- Students can view their own data and appeal placements within a set window.
- No automated decision affects a student's standing without a faculty review.
- Data is retained for one academic year, then deleted.
- Every allocation run is recorded for audit, including the inputs, weights, and the policy version in force.

## Intended technical stack

The prototype is a single HTML file. The production system is planned as follows.

- Front end: Next.js, deployed on Vercel
- Auth and database: Supabase, using Postgres and institutional Google sign-in
- Activity source: Google Drive API, read by metadata only, on a scheduled poll
- Email: Resend, for faculty check-ins and notifications

### Data model sketch

- users: identity, role, department
- cohorts: semester, supervising lecturer, members
- teams: project, members, roles, health score
- skills and scores: declared values, confidence, adjusted score, evidence links
- activity: per-student metadata polled from Drive
- alerts: type, tier, target, status
- appeals: student, reason, status, window
- audit: one record per allocation run

### Security model

- The Supabase service role key and the Google secret are used only on the server.
- Row-level security restricts every read to the records a user is allowed to see.
- Inputs are validated on the server, not trusted from the client.
- The Drive service account is scoped to the shared workspace folders only.

## Why these choices

The hard part of group projects is not building software, it is fairness and accountability. The design keeps the scoring transparent, keeps a human in the loop for every consequence, and records enough to settle a grade dispute later. The maximin objective and the consent-first data model are the two ideas the rest of the system is built to support.
