# AEGIS — Automated Engineering Group Intelligence System

A transparent, ethics-first capstone allocation and governance platform. AEGIS handles evidence-weighted skill scoring, duplicate project detection, maximin-fair team formation, capacity-aware task allocation, and consented engagement monitoring — all running as a background engine that feeds a clean faculty dashboard instead of dumping raw telemetry on lecturers.

---

## The Problem

Capstone project allocation at scale has four failure modes that manual processes can't catch in time:

1. **Student Deception** — self-reported skill scores are inflated; Dunning-Kruger effects corrupt team formation data
2. **Topic Overlap** — multiple groups submit structurally identical project proposals
3. **Interpersonal Fragility** — high performers silently absorb a teammate's workload (Sympathy Carry) while underperformers vanish entirely (Ghosting)
4. **Administrative Overhead** — faculty waste time parsing raw activity logs instead of acting on actual problems

AEGIS addresses all four with verified inputs, NLP-based project filtering, anchor-clustering team assembly, and a three-tier behavioral escalation system.

---

## Users

**System Admin**
- Approves lecturer accounts before access is granted
- Creates academic years, semesters, departments, and modules
- Assigns lecturers to specific student cohorts (lecturers cannot see outside their assignment)
- Full system visibility across all users, teams, and projects

**Lecturer / Supervisor**
- Sees only students assigned by admin
- Monitors team health scores, behavioral flags, and contribution breakdowns
- Creates and manages projects
- Can override AEGIS recommendations
- Receives pre-composed intervention templates instead of raw alert data

**Student**
- Self-registers and completes a structured onboarding profile
- Skill scores are verified silently on the backend before allocation runs
- Gets placed into a project, team, and role by the AEGIS engine
- All workspace activity feeds the continuous monitoring layer

---

## End-to-End Pipeline

```
Student Registration & Consented Onboarding
       ↓
Phase A: Input Triangulation & Skill Verification
       ↓
Phase B: Project Deduplication + Team Assembly (Maximin Fairness + SPA Matching)
       ↓
Role Assignment (student-led within team) + Capacity-Based Task Allocation
       ↓
Team Workspace Auto-Provisioned (Google Drive, Docs, Sheets, Slides)
       ↓
Phase C: Workspace Telemetry + Consented Engagement Monitoring (72hr polling)
       ↓
Faculty Dashboard (triaged alerts, contextual options, pre-written intervention templates)
```

---

## Phase A: Input Triangulation & Skill Verification

Rather than accepting self-reported skill data, AEGIS triangulates each student's real capability across three separate input channels:

| Channel | Source | Description |
|--------|--------|-------------|
| T1 | LMS Grade Sync | Hard academic history pulled directly from course records (e.g. advanced prerequisite grades). Used where available; system remains fully functional without it. |
| T2 | Adaptive Skill Survey | Forced-choice technical and situational scenarios presented as a profiling exercise. Students are told this informs their placement. Genuine responses are encouraged by design — claiming skills they cannot demonstrate will result in a placement that does not match their actual ability, which works against them. Results are shown to the student after placement, with an explanation and an appeals window. |
| T3 | Preferred Teammate (optional) | Students may optionally name a preferred teammate. This is treated as a soft signal the engine may or may not honour depending on the balance constraints. If it cannot be honoured, the student is told why. Peer vouching or popularity metrics are not used as inputs to any score. |

### Skill Score Formula

The verified capability scalar for any skill discipline (Technical, UX, Management, Communication) is computed as:

```
S_pillar = (w1 × LMS_grade) + (w2 × Survey_score)
```

Where `w1` and `w2` are configurable weights per discipline.

### Verification: Evidence-Confidence Weighting

Rather than a hard binary override, AEGIS applies a smooth confidence discount to every declared skill level. Each declared skill `L(i,k)` is multiplied by an evidence confidence factor `C(i,k)`:

```
Â(i,k) = L(i,k) × C(i,k)
```

| C Value | Basis |
|---------|-------|
| 1.0 | Verified (institutional grade or assessed record) |
| 0.8 | Portfolio or prior work submitted |
| 0.6 | Self-report only (default — no LMS data required) |
| 0.5 | Self-report contradicted by observed task throughput |

A high self-claim with no evidence is gracefully discounted rather than abruptly replaced. If observed task performance later contradicts a claim, `C` is reduced incrementally. This works whether or not LMS data is available. The adjusted score `Â` is visible to the student in their profile view after placement.

### Output: Student Profile Object

Each verified student is compiled into a profile object consumed by all downstream phases. This object is visible to the student in their own dashboard after placement, together with an explanation of how their placement was decided.

```json
{
  "student_id": "STU_88921",
  "skill_matrix_adjusted": {
    "technical_architecture": { "declared": 8.5, "confidence": 0.8, "adjusted": 6.8 },
    "user_experience_design": { "declared": 3.0, "confidence": 0.6, "adjusted": 1.8 },
    "project_management_ops": { "declared": 5.5, "confidence": 1.0, "adjusted": 5.5 },
    "communication_presentation": { "declared": 7.0, "confidence": 0.8, "adjusted": 5.6 }
  },
  "capacity_allowance_hours": 8.0,
  "preferred_teammate": "STU_44301",
  "preferred_projects": ["P_03", "P_07", "P_11"]
}
```

**Note:** No ghosting risk label, popularity score, or peer vouch count is attached to a student's profile at intake. Disengagement risk is only computed from live, in-project behaviour after the project starts, with human review before any action is taken.

---

## Phase B: Project Filtering & Team Assembly

### NLP Cosine Similarity Gate (Duplicate Detection)

Before any team is confirmed, submitted project abstracts are parsed into high-dimensional term-frequency vectors and checked for semantic overlap:

```
Similarity Score = (A⃗ · B⃗) / (‖A⃗‖ × ‖B⃗‖)
```

If the similarity score between any two submissions is **≥ 0.75 (75%)**, the system locks the project portal and forces the group to change their tech stack or market domain before proceeding. No two teams can run structurally identical projects.

### Team Assembly — Maximin Fairness + SPA Matching

Once projects clear the similarity gate, students are placed into teams using the Abraham–Manlove Student-Project Allocation (SPA) algorithm combined with a maximin fairness objective. The goal is for every team to reach a similar skill level — no team is allowed to be loaded with the weakest students while another gets all the strongest.

**Seeding Phase — Rare Skill Placement**
Students with rare or hard-to-fill critical skills are placed first into the projects that need them most. These act as seeds, not anchors — the whole team is built around balance, not around any single persona.

**Greedy Expansion**
Remaining students are added to each seeded team in a way that maximises skill coverage and schedule overlap.

**Local-Search Swap Pass**
Once initial teams are formed, the engine repeatedly tests pairwise swaps between teams. A swap is accepted only if it raises the score of the weakest team (maximin). This continues until no improving swap exists.

**Exception Pool**
Students who cannot be placed without breaking a hard constraint are moved to a faculty-reviewed exception pool. The lecturer is notified with full context and options.

**No scaffolded cells.** Weaker students are distributed across all teams. The maximin objective makes it mathematically impossible for the formation to concentrate them. Optional Graduate TA support is available to any team based on live health signals — not assigned by intake label.

**Role assignment within teams is student-led.** After placement is published, team members decide among themselves who takes which role. AEGIS surfaces each member's adjusted skill profile to help the team make an informed decision. No role is pre-assigned by the system.

---

## Role Assignment (Student-Led)

After placement is published, the team decides role assignments among themselves. AEGIS shows each member's adjusted skill profile (`Â`) within the team view to help the group make an informed decision. The system does not assign or enforce any role. If a role remains unfilled or a clear mismatch is flagged by the team, the lecturer is notified via the dashboard alert queue.

Common roles within a capstone team typically include Technical Lead, Research Lead, Documentation Lead, and QA Lead — but teams are free to structure themselves as suits their project.

---

## Capacity-Based Task Allocation

Tasks are distributed relative to each student's `capacity_allowance_hours` from their passport. The system prevents overloading at the assignment stage rather than detecting it after the fact.

### Capacity Allocation Formula

Before any task is assigned, each student receives a proportional share of the team's total workload based on their declared `capacity_allowance_hours`:

```
Task_Share(i) = capacity_allowance_hours(i) / Σ capacity_allowance_hours(all team members)
```

The total estimated task hours for a project are then distributed according to each student's share:

```
Hours_Assigned(i) = Task_Share(i) × Total_Project_Hours
```

This ensures a student with 8 available hours per week is never assigned the same volume as one with 4, and prevents overloading before it happens rather than detecting it after.

### Dynamic Task Splitting

Large milestone tasks are automatically decomposed into subtasks before assignment:

```
Build Mobile App
├── UI Design        → assigned to UX specialist
├── Backend Logic    → assigned to Technical Anchor
├── Testing          → assigned to QA Lead
└── Documentation    → assigned to Documentation Lead
```

---

## Phase C: Workspace Telemetry & Engagement Monitoring

After workspace provisioning, AEGIS polls connected app APIs every **72 hours** to measure actual contribution instead of relying on self-reported status updates. Students are informed at onboarding that engagement is monitored, what signals are collected, and why — this tracking exists to protect the team, ensure fair contribution, and give the lecturer an objective record for grade disputes. No covert surveillance runs at any point.

### Week 2 Calibration Task

A structured setup task is assigned in week 2 as a standard introductory milestone (e.g. setting up the project repository structure and pushing an initial commit). Students know this is an assessed activity. If a student does not complete it, a skill gap alert is surfaced to the faculty dashboard for the lecturer to review and decide whether action is needed.

### Sympathy Carry Detection (Poached Task Intercept)

The system monitors file contribution hashes against explicit task assignments. If a high-performing student is completing work assigned to someone else:

```
IF Task_Assigned(UserB) AND Commit_Author(UserA) AND Contribution_Ratio(A) ≥ 0.95
THEN:
  → Halt submission completion approval
  → Log automated workload theft warning
  → Push workspace prompt to high performer to re-delegate
```

### 3-Tier Ghosting Escalation Protocol

Passive digital footprints (Git commits, document edits, workspace message pings) are tracked continuously. When activity drops:

| Tier | Trigger Condition | Automated Response |
|------|------------------|--------------------|
| Tier 1 | Active footprint drops ≥ 40% | System sends soft check-in nudge to student |
| Tier 2 | 6 consecutive days of zero input | Non-critical tasks unassigned from inactive node; redistributed to preserve team traction |
| Tier 3 | 10 consecutive days of zero input | Critical priority alert routed to faculty overwatch console |

### Team Health Score

Each team receives a continuous 0–100 health score recomputed every 72 hours:

```
Health_Score = 100 × ( (w_tc × task_completion_rate)
                      + (w_at × attendance_rate)
                      + (w_wb × workload_balance_index)
                      + (w_en × engagement_signal_rate)
                      + (w_mp × milestone_progress_ratio) )
```

Where all five weights sum to 1.0 (default distribution: 0.30, 0.15, 0.25, 0.15, 0.15) and each input is normalized to a 0–1 range:

- `task_completion_rate` — tasks marked done / total tasks assigned in the current sprint
- `attendance_rate` — meetings attended / meetings scheduled (pulled from workspace calendar)
- `workload_balance_index` — `1 − StdDev(individual_utilization_scores)` across team members; a perfectly balanced team scores 1.0
- `engagement_signal_rate` — active workspace events (commits, edits, pings) / expected baseline events for the current week
- `milestone_progress_ratio` — milestones completed on time / total milestones due to date

Teams are classified as:

- **Healthy** (≥ 75)
- **At Risk** (50–74)
- **Critical** (< 50)

### Burnout Detection

Burnout risk is flagged when an individual student's utilization ratio significantly exceeds the team average:

```
IF Utilization(Student_A) ≥ 2× Team_Average_Utilization
THEN flag: Sympathy Carry Risk → WARNING
```

Example:
```
Team Average Utilization = 0.7
Student A Utilization    = 1.4   ← flagged
```

---

## Faculty Dashboard

The engine distills all anomalies into a triaged alert inbox so faculty never need to parse raw logs. Every decision made through the dashboard — including overrides, appeals, and mid-semester changes — is logged with a timestamp and the reason given, creating a full evidence trail for grade disputes.

### Sample Alert Queue

| Risk Level | Team | Trigger | Automated Action |
|-----------|------|---------|-----------------|
| CRITICAL | Team 12 | Student: 11 days zero footprint | Tier 3 escalation — faculty decision required |
| WARNING | Team 04 | Student carrying 88% workload ratio | Sympathy carry flag — faculty review recommended |
| INFO | Team 07 | New student joined mid-semester | Mid-semester change panel opened — see options below |

### Pre-Composed Check-in Template

When an engagement flag is raised, faculty receive a ready-to-send, honest check-in email. The email does not hide that the lecturer is aware of a concern — students know at onboarding that engagement is tracked:

```
Subject: Capstone Check-in — Team [Team_ID]

Hi [Student_Name],

I wanted to reach out as part of my regular review of team progress this semester.
I've noticed your activity on the project workspace has been lower than expected over
the past week or two, and I'd like to understand what's going on.

Please drop by my office hours at [Time/Day] so we can have a quick chat and make
sure you're getting any support you need.

Looking forward to hearing from you.
[Professor_Name]
```

### Mid-Semester Change Panel

When a student drops out, joins late, or becomes unreachable, the system raises a structured alert directly on the lecturer's dashboard. The lecturer is presented with the full context and a set of options to choose from:

**Trigger:** Student status change detected (dropout, late registration, or 10+ day zero footprint with no response to Tier 2 nudge)

**Context shown to lecturer:**
- Affected team, current health score, skill coverage gap (if any) left by the change
- The student's adjusted skill profile and tasks currently assigned to them

**Options presented:**

| Option | What it does |
|--------|-------------|
| Reassign tasks within team | Redistributes the departed student's tasks among remaining members; recomputes utilisation |
| Insert a late-joining student | Fills a genuine skill gap in the affected team only; does not reshuffle any other team |
| Batch late joiners into a new team | Groups unplaced late registrants together if enough exist to form a viable team |
| Flag for manual review | Escalates to admin; lecturer documents reason; no automated action taken |

Only the affected team is ever recomputed. The rest of the cohort's allocation is never reshuffled.

---

## Additional Student-Facing Features

**AI Project Recommendation** — student enters skills, interests, and career goals; AEGIS recommends best-fit projects and roles before allocation runs

**Project Demand Predictor** — before allocation begins, each project is assigned a predicted demand score based on historical and current cohort signals:

```
PDP(p) = ( (w_enr × enrollment_interest_ratio(p))
          + (w_skl × skill_match_density(p))
          + (w_his × historical_oversubscription_rate(p)) ) × 10
```

Where:
- `enrollment_interest_ratio` — students who listed project `p` as a preference / total students in cohort
- `skill_match_density` — proportion of the cohort whose skill passport matches the project's required competency profile
- `historical_oversubscription_rate` — how often this project type was over-requested in past semesters (normalized 0–1)

Output is a score from 0–10 classified as Low (0–3), Medium (4–6), or High (7–10) demand. Faculty use this to pre-allocate capacity and decide which projects to duplicate or cap before registration closes.

**Team Compatibility Score** — computed before team is finalized and displayed as a percentage:

```
TCS(i,j) = ( (w_sch × schedule_overlap_ratio(i,j))
           + (w_sty × working_style_match(i,j))
           + (w_com × communication_pref_match(i,j)) ) × 100
```

Where:
- `schedule_overlap_ratio` — shared available hours / total required collaboration hours
- `working_style_match` — cosine similarity between style preference vectors (async vs sync, structured vs flexible, etc.)
- `communication_pref_match` — binary match score across channel preferences (chat, video, in-person), averaged across dimensions
- Weights `w_sch`, `w_sty`, `w_com` sum to 1.0

The TCS is computed pairwise for every student combination within a proposed team, then averaged to produce one team-level score. Teams below a configurable threshold (default: 60%) are flagged for review before allocation is confirmed.

**Skill Gap Analyzer** — surfaces missing competencies per team before confirmation; suggests adding a student or providing training resources

**Digital Team Contract** — each member agrees to meeting frequency, response times, and individual responsibilities at team formation

**Semester Learning Profile** — skill scores update across semesters, making future allocation runs progressively more accurate

**Contribution Ledger** — logs every task completed, file uploaded, review performed, and meeting attended. Raw activity is converted into a normalized Contribution Score per student:

```
CLS(i) = ( (w_tk × tasks_completed(i) / tasks_assigned(i))
          + (w_fl × files_uploaded(i) / team_avg_files)
          + (w_rv × reviews_performed(i) / reviews_expected(i))
          + (w_mt × meetings_attended(i) / meetings_scheduled) ) × 100
```

Where all four weights sum to 1.0 (default: 0.40, 0.20, 0.20, 0.20). A score of 100 means the student met every assigned obligation. Scores below 50 trigger a WARNING flag. Referenced in grading disputes as an objective activity record.

**Portfolio Generator** — at project end, generates a structured student summary (role, tasks completed, milestones delivered) for internship and CV use

---

## Alert Severity Reference

| Level | Trigger |
|-------|---------|
| INFO | Team formed, workspace provisioned, contract signed |
| WARNING | Workload imbalance, burnout risk, skill gap detected |
| CRITICAL | 10+ days zero activity, milestone missed, poached task confirmed |

---

## Prototype Scope (Cipher 2.0 Top 10)

Minimum viable screens for the prototype phase:

1. Login — student / lecturer / admin (separate flows)
2. Student onboarding form (skills, capacity, preferences)
3. Team allocation dashboard (with anchor clustering visualization)
4. Team workspace (task board, shared files, milestones, progress)
5. Lecturer dashboard (health scores, threat queue, alerts)
6. Admin panel (account approvals, lecturer-to-cohort assignment)

---

## Cipher 2.0 Scenario Alignment

AEGIS was built around Scenario 03 requirements: skill-based team formation, role assignment, capacity-aware task allocation, conflict detection, and faculty governance.

The allocation engine is the hero feature. The Cosine Similarity gate, the 4-Round Anchor Clustering loop, the Dunning-Kruger override, and the 3-tier ghosting protocol are what separate this from a basic matching algorithm. The workspace and monitoring layer exist to generate the behavioral signals that make governance possible.

---

## Transparency & Consent Framework

AEGIS operates on one guiding principle: **full detection power, delivered with full transparency.** Every behavioural risk a covert system might detect, AEGIS detects too — but students know about it from day one.

- **Consent first:** at onboarding, students are told exactly what is collected (workspace edits, task completions, meeting attendance, commit activity), why it is tracked (to protect their team, ensure fair contribution, and provide an objective record for grade disputes), and how it affects their standing. Monitoring is transparent — there is no covert surveillance.
- **Profile visibility:** after placement, every student can view their own adjusted skill profile (`Â`), see the confidence level assigned to each skill, and understand how their placement was determined.
- **Placement explanation & appeals:** every placement comes with a reason summary. After publication, a formal appeals window opens. Students submit evidence-based appeals; the relevant lecturer reviews each one and accepts or denies it with a written reason. Outcomes are logged.
- **Data minimisation & RBAC:** only work-product metadata is used; sensitive personal attributes are excluded from scoring; access is role-based; data is retained only as long as needed.
- **Bias monitoring:** the system checks each semester whether any demographic group is repeatedly receiving lower placements and publishes its scoring factors for institutional review.
- **No pre-crime labelling:** no student is assigned a risk label before the project begins. Disengagement risk is only computed from live, in-project behaviour after the project has started, with human review before any action is taken.

---

## Evidence-Weighted Proficiency (Anti-Misreporting Foundation)

Self-reported skill data is treated with scepticism. Every declared skill level `L(i,k)` on a 1–5 scale is multiplied by an evidence-confidence factor `C(i,k)` before any other calculation uses it:

```
Â(i,k) = L(i,k) × C(i,k)
```

Confidence tiers:

| C Value | Basis |
|---------|-------|
| 1.0 | Verified (institutional grade or assessed record) |
| 0.8 | Portfolio or prior work submitted |
| 0.6 | Self-report only (default — no LMS data required) |
| 0.5 | Self-report contradicted by observed task throughput |

A confident but unsupported "5/5" is effectively treated as ~2.5–3.0, while a verified 4/5 is trusted at 4.0. If observed task throughput later contradicts a claim, `C` is reduced incrementally — a smooth, graceful adjustment rather than an abrupt hard override. This method remains fully functional where LMS grade data is unavailable. The adjusted score and its confidence tier are visible to the student in their own profile view.

---

## Student–Project Fit Score

```
Fit(i,p) = 100 × [ 0.50·SkillMatch + 0.30·AvailMatch + 0.20·RoleMatch ]
```

- **SkillMatch** — weighted coverage of project skills using `Â`; each skill capped at "requirement met" (critical skills weighted ×2). Covering project needs beats raw brilliance.
- **AvailMatch** — overlap of student slots with project meeting times ÷ required common hours, capped at 1.
- **RoleMatch** — 1.0 for preferred role / 0.6 secondary / 0.3 neither.

---

## Project Demand & Oversubscription Resolution (Abraham–Manlove SPA)

When multiple students compete for the same project, allocation uses the **Abraham–Manlove Student-Project Allocation (SPA)** algorithm — a provably optimal extension of deferred-acceptance stable matching designed specifically for the student-project allocation problem. It avoids first-come-first-served bias and lets rejected students cascade fairly to their next preference:

```
# Oversubscription resolution (Abraham-Manlove SPA, many-to-one)
while some student is free and has an un-tried preference:
    p ← student's next-most-preferred project
    provisionally place student in p
    if p over capacity:
        Priority(i,p) = Fit(i,p) + RareSkillBonus(i,p)   # +15 if i fills a scarce critical skill
        keep top cap(p) students by Priority; release the rest
return stable, envy-reduced assignment of students to projects
```

Topic duplication is screened by cosine similarity on proposal text vectors; pairs at or above the threshold are **flagged for faculty review** rather than hard-blocked, preserving an override path.

---

## Balanced Team Formation — Maximin Fairness Objective

Each candidate team is scored 0–100. The global formation objective is:

```
maximise  min_T TeamScore(T)  subject to all hard constraints
```

Maximising the *weakest* team's score makes it mathematically impossible to stack all weak students into one doomed group. An anti-concentration rule caps any single specialisation at ≤ ~60% of a team, blocking the sandbox effect.

### Team Score Components

| Component (weight) | Meaning | Defends against |
|--------------------|---------|-----------------|
| Critical-skill coverage (30) | Fraction of critical skills met using Â | Ghost team |
| Schedule compatibility (20) | Common hours ÷ required, capped | Schedule paralysis |
| Role coverage (15) | Average role-fit of filled roles | Weak role fit |
| Preference satisfaction (15) | 1st = 1.0 / 2nd = 0.7 / 3rd = 0.4 | Low morale |
| Workload balance (10) | Evenness of member capacity | Uneven load |
| Experience balance (10) | Closeness to cohort skill target | Sandbox effect |
| Penalties (−) | Missing critical skill, clash, overload, solo-status (tokenism) | Hard-rule breaches |

### Formation Algorithm

```
validate profiles; split hard vs soft constraints
place students with RARE critical skills first into hardest-to-fill projects
greedily add members who raise skill coverage and schedule overlap
score every team; repeat:
    find a swap between teams that raises the MINIMUM team score
    if swap breaks a hard constraint: reject
until no improving swap found or iteration limit reached
move unresolved students to an exception pool for faculty review
```

---

## Role Assignment Formula

Within each team, roles are assigned to maximise total RoleFit across the members × roles matrix:

```
RoleFit(i,r) = 100 × [ 0.45·RoleSkill + 0.20·RolePref + 0.15·Experience + 0.10·Availability + 0.10·Leadership ]
```

No student holds more than one major role unless the team is too small. Any role filled below RoleFit 50 is flagged for review.

---

## Task Allocation — Extended Formulas

### TaskFit Score

```
TaskFit(i,t) = 100 × [ 0.40·SkillMatch + 0.20·RoleRelevance + 0.15·Availability + 0.10·Learning − 0.15·CurrentLoad ]
```

### True Capacity & Utilisation

```
TrueCap(i) = AvailableHours − ExistingCommitments
U(i) = AssignedEffort ÷ TrueCap(i)
```

### Fairness Rules

- Target utilisation band: **0.7 – 1.0** per student.
- Overload threshold: `U > 1.2` → automatic rebalancing triggered.
- Variance of `U` across the team is minimised — one member far above the median is the sympathy-carry tripwire.

```
process tasks by priority & dependency order
drop members below minimum required skill
drop members with no remaining capacity
score remaining by TaskFit; assign best as owner
    (+ supporting member if collaboration helps)
recompute U; if U(i) > 1.2 → rebalance
flag any task with no feasible assignee
```

---

## Hard vs Soft Constraints

### Hard (compulsory — checked before scoring)

- Every eligible student placed in exactly one team.
- Team size within the permitted range.
- All mandatory critical skills covered, or formally flagged.
- No student assigned beyond maximum capacity.
- No serious timetable conflict; required roles filled where possible.

### Soft (optimised after hard constraints pass)

- Maximise project-preference satisfaction.
- Maximise skill coverage; balance skill levels across teams.
- Improve availability overlap; match role preferences.
- Balance workload; avoid concentrating experts.
- Credit learning potential without penalising beginners.
- Minimise faculty interventions.

A high soft score can **never** override a hard constraint violation.

---

## Tie-Breaking Order

1. Higher minimum team score (maximin)
2. Better critical-skill coverage
3. Better preference satisfaction
4. Transparent random draw or submission timestamp — used only as the final tie-break

---

## Student Appeals Window

After faculty publish the allocation, a formal appeals window opens. Students may challenge a placement with evidence. Appeals follow consistent evidence-based rules and outcomes are logged alongside faculty override records.

---

## Feasibility & Scalability

### Operational

- Uses data a faculty can realistically collect via a web form.
- Removes repetitive manual allocation; keeps humans responsible for exceptional decisions.
- Can start as a simple form + database and be introduced in phases.

### Technical

- Standard relational records; transparent scoring and rules — no opaque model.
- Batch processing for initial formation; event-based updates for later changes.
- Indexed lookups for student, project and timetable data; asynchronous notifications.
- The pipeline is modular — profile collection, matching, team formation, role assignment, task allocation, and monitoring are separable stages.
- Independent project pools processed **in parallel**; repeated compatibility calculations **cached**; only teams affected by a change **recomputed incrementally**; notifications and reports run through a **queue**.

---

## Phased Rollout

| Phase | Scope | Dependency |
|-------|-------|------------|
| Phase 1 | Profiles, project preferences, evidence-weighted scoring, matching, basic team formation, faculty review. | Web form + database only. |
| Phase 2 | Automated role matching, conflict detection, task allocation, severity dashboard. | Supervisor task data. |
| Phase 3 | Consented workload monitoring, supervisor analytics, appeals, semester-over-semester tuning. | LMS / repository / chat integrations where available. |

---

## Limitations & Mitigations

| Limitation | Mitigation |
|------------|------------|
| Students may exaggerate skills. | Evidence weighting, validation tasks, lecturer confirmation, throughput feedback into C. |
| A balanced team may not be socially compatible. | Short review period, supervisor feedback, carefully controlled preference data. |
| Perfect allocation may be impossible. | Severity-based flags and faculty review for unavoidable conflicts. |
| Scoring weights may create bias. | Publish factors, compare team distributions, review weights each semester. |
| Conflicting fairness definitions cannot all hold at once. | State the chosen definition (maximin) explicitly; keep human override for the rest. |
| Task estimates may be inaccurate. | Supervisors update effort; workload recalculates automatically. |
| Forcing too much diversity can hurt team functioning. | Treat diversity as a soft target with bounds, not a hard maximum. |

---

## Success Metrics

**Illustrative targets (goals, not proven results):**

- 100% of eligible students assigned or formally flagged.
- ≥ 90% of teams covering all mandatory skills without intervention.
- Zero critical timetable conflicts at publication.
- Team utilisation kept within an agreed tolerance band.
- Major reduction in manual allocation time versus current process.

**Ongoing measurements:**

- % of teams covering all critical skills without intervention.
- Unresolved timetable conflicts at publication.
- Average project-preference satisfaction.
- Workload-utilisation variance within teams.
- Count of overloaded or task-less students.
- Number of faculty overrides and appeal outcomes.
- Allocation runtime and manual hours saved.
- Student and supervisor satisfaction scores.
- Skill-coverage gap between strongest and weakest team.

---

## Student-Facing UI

### Dashboard (landing page on login)

When a student logs in they land on a personal dashboard. Everything scoped to them and their team — no raw system data exposed.

**Top stat row (immediate snapshot):**
- Tasks remaining in current sprint
- Personal contribution score (0–100)
- Hours used this week vs their capacity cap
- Days until next milestone

**Main panels:**
- My tasks — sprint task list with status (to-do / in progress / done), due dates, and effort estimates
- Team files — Google Doc, Sheet, and Slides listed with last-edited-by and a one-click open button
- Team health score — the 0–100 team score with sub-bars for workload balance, milestone progress, and engagement
- Team members — each member's contribution score as a bar; low scorers visually stand out without any label calling them out
- Recent activity feed — timestamped log of edits, uploads, and completions across the team
- Notifications — upcoming due dates, inactive teammate flags, milestone warnings

### Workspace Tab

The workspace tab is where students actually work. It has three file tabs auto-provisioned at team formation (Project Report, Task Tracker, Slides) plus a button to add more files.

**Embedded file area:**
- The active Google Doc / Sheet / Slides file renders inside an iframe — students never leave AEGIS to work on documents
- Live collaborator cursors are visible (real Google Docs collab running inside the embed)
- A toolbar shows who is currently editing and an "Open in Google" escape hatch for full-screen editing
- Switching tabs switches the embedded file instantly

**Sidebar (always visible in workspace):**
- Team online — who is active right now, who was last seen and when
- My tasks — compact checklist of current sprint tasks
- Activity log — real-time feed of edits and uploads with timestamps per member
- Team chat — built into AEGIS, separate from Google, so all messages are logged as engagement signals

---

## Google Workspace Integration

### How it works

AEGIS uses the **Google Drive API** with a single service account to programmatically manage all team files. Students authenticate once via Google OAuth and get access only to their own team's folder.

### File provisioning at team formation

When the allocation engine finalises a team, the backend automatically:

```js
// 1. Create a folder for the team
const folder = await drive.files.create({
  resource: { name: `Team ${teamId}`, mimeType: 'application/vnd.google-apps.folder' }
})

// 2. Create Doc, Sheet, Slides inside it
await drive.files.create({
  resource: { name: 'Project Report', mimeType: 'application/vnd.google-apps.document', parents: [folder.id] }
})
await drive.files.create({
  resource: { name: 'Task Tracker', mimeType: 'application/vnd.google-apps.spreadsheet', parents: [folder.id] }
})
await drive.files.create({
  resource: { name: 'Presentation', mimeType: 'application/vnd.google-apps.presentation', parents: [folder.id] }
})

// 3. Share with team members only
for (const member of members) {
  await drive.permissions.create({
    fileId: folder.id,
    resource: { type: 'user', role: 'writer', emailAddress: member.email }
  })
}
```

This runs once per team at allocation time. Thousands of teams are provisioned in parallel in under a minute.

### Embedding inside AEGIS

Files render inside the workspace via iframe. Students work in the real Google editor without leaving the platform:

```js
<iframe src="https://docs.google.com/document/d/FILE_ID/edit?embedded=true" />
```

### File isolation (cross-team security)

Each team folder is only shared with that team's members at the Google permission level. Even if a student knows another team's file ID, Google returns a permission denied error. AEGIS additionally never exposes file IDs belonging to other teams in its own UI — the platform is the gatekeeper, Google enforces it at the storage layer.

### Activity tracking — Drive Activity API

Student engagement is tracked at the Google Drive API level, not inside the AEGIS iframe. This means tracking works identically whether the student works inside AEGIS or clicks "Open in Google" and works directly on docs.google.com — the activity is recorded either way.

```js
// Polls every 72hrs — returns all activity on a file regardless of where it was done
const res = await driveActivity.activity.query({
  requestBody: {
    itemName: `items/${fileId}`,
    filter: 'time >= "2026-06-06T00:00:00Z"'
  }
})
// Returns: who acted, what action, when, time spent active
```

**Per-student signals returned:**
- Who edited and when
- Number of revisions made (contribution volume)
- Approximate active editing time in the file
- View-only events (opened but did not edit)

These signals feed directly into the `engagement_signal_rate` component of the Team Health Score and the 3-tier ghosting escalation protocol. A student who opens a file in Google directly contributes the same signals as one who works inside the AEGIS embed.

**Note:** The API captures active edit time, not total tab-open time. A student viewing a document without typing is logged as a view event, not an edit. This is intentional — AEGIS measures contribution, not passive presence.

### Scale

Google Drive API allows up to 12,000 requests per 100 seconds per service account. At 72hr polling intervals across thousands of teams, quota usage is well within limits. File creation for large cohorts is batched and completes in seconds.
