# AEGIS Platform — Policies

**Jurisdiction:** Sri Lanka
**Governing Law:** Personal Data Protection Act No. 9 of 2022 (PDPA), Computer Crimes Act No. 24 of 2007, and applicable regulations of the University Grants Commission of Sri Lanka.
**Effective Date:** [Insert Date]
**Maintained by:** [Institution Name]

---

## Part 1 — Privacy Policy

### 1. Introduction

AEGIS (Automated Engineering Group Intelligence System) is operated by [Institution Name] ("the Institution") for the purpose of managing capstone project allocation, team formation, and academic performance monitoring. This Privacy Policy explains how the AEGIS platform collects, processes, stores, and shares personal data in compliance with the Personal Data Protection Act No. 9 of 2022 of Sri Lanka.

By registering and using AEGIS, all users — students, lecturers, and system administrators — acknowledge that they have read and understood this policy.

---

### 2. Data Controller

**Institution Name:** [Insert Institution Name]
**Address:** [Insert Address]
**Contact:** [Insert Data Protection Contact Email]

---

### 3. Who This Policy Applies To

This policy applies to:

- **Students** who register, complete onboarding, and use the AEGIS platform workspace.
- **Lecturers and Supervisors** assigned to student cohorts within AEGIS.
- **System Administrators** who manage platform configuration and user access.

---

### 4. What Personal Data We Collect

#### 4.1 Student Data

| Data Category | Specific Data Points |
|---|---|
| Identity | Full name, student ID, institutional email address |
| Academic Records | Module grades, prerequisite course results, LMS attendance rate (pulled via LMS grade sync where available) |
| Skill & Proficiency Data | Self-reported skill ratings, scenario-based survey responses, evidence-weighted proficiency scores |
| Behavioural & Engagement Data | Google Drive edit events, revision counts, active editing time, view-only events, workspace chat messages, task completion records, meeting attendance, GitHub contribution events (where GitHub integration is enabled) |
| Derived / Computed Data | Verified skill matrix scores, Role DNA persona, Team Health Score contribution, Contribution Score, Capacity Allowance, Student-Project Fit Score, Team Compatibility Score |
| Preference Data | Project preferences, role preferences, working style preferences, communication preferences, available hours, optional preferred teammate nomination |

#### 4.2 Lecturer / Supervisor Data

| Data Category | Specific Data Points |
|---|---|
| Identity | Full name, staff ID, institutional email address |
| Access Records | Login timestamps, override actions taken, intervention templates sent, alert acknowledgements |

#### 4.3 System Administrator Data

| Data Category | Specific Data Points |
|---|---|
| Identity | Full name, staff ID, institutional email address |
| Configuration Records | Academic year, semester, department, and cohort assignment actions |

---

### 5. How We Collect Data

Data is collected through the following channels:

**Direct Input**
- Student self-registration and onboarding profile completion.
- Skill self-assessments and project/role preference submissions.
- Working style and availability declarations.
- Optional preferred teammate nominations (used as a soft signal only; the system may not honour it, and students are informed of the reason when it is not).

**Automated System Channels**
- LMS Grade Sync (T1): Academic grades and attendance pulled directly from the institutional Learning Management System, where available. Where LMS data is unavailable, skill scoring proceeds using the scenario survey (T2) alone.
- Scenario-Based Survey (T2): Structured forced-choice scenario assessments completed during onboarding. Students are not told the survey is a skill check at the time of completion, in order to capture genuine responses. Students are, however, informed at onboarding that their placement is partly based on a capability assessment, and their placement outcome is explained to them after allocation. An appeals window is provided if they disagree with the outcome.
- GitHub Integration (where enabled): Contribution events, commit frequency, and collaboration activity are captured for workspace engagement scoring. Students are notified of this integration during onboarding.
- Google Drive Activity API: Workspace engagement signals polled at 72-hour intervals, capturing edit events, revision counts, approximate active editing time, and view events.
- AEGIS Workspace Chat: Messages sent through the built-in team chat are logged as engagement signals (volume and frequency only; content is not analysed for meaning).
- Google Workspace integrations: Docs, Sheets, Slides, and Calendar activity within the institutional workspace are captured as engagement and collaboration signals.

**Third-Party Integration**
- Google OAuth is used for student authentication and Google Drive file access. AEGIS connects via a single institutional service account. Students are notified of this integration during onboarding and must grant consent before accessing the workspace.
- GitHub OAuth (where enabled) is used for repository access and contribution tracking. Consent is obtained separately during onboarding.

---

### 6. Legal Basis for Processing

Under the Personal Data Protection Act No. 9 of 2022, AEGIS processes personal data on the following bases:

| Processing Activity | Legal Basis |
|---|---|
| Student registration and profile creation | Consent (obtained at onboarding) |
| LMS grade and attendance sync | Legitimate interest of the Institution in accurate academic assessment |
| Skill verification and scoring | Consent and legitimate academic interest |
| Team formation and project allocation | Legitimate interest in fair and effective academic administration |
| Behavioural monitoring (workspace telemetry) | Consent (obtained at onboarding with full disclosure of what is monitored and why) |
| Disengagement escalation and faculty alerts | Legitimate interest in student academic welfare |
| Google Drive and GitHub integration | Consent (OAuth flow) |
| Faculty override and intervention logging | Legitimate interest in accountability and audit |

---

### 7. How We Use Your Data

AEGIS uses collected data solely for the following academic purposes:

- Verifying and triangulating student skill levels to enable accurate, fair team formation.
- Assembling balanced, equal-skill teams using the maximin fairness objective — the goal is that every team has an equivalent level of combined skill and capability.
- Detecting duplicate project proposals to ensure academic integrity.
- Assigning tasks proportional to student capacity.
- Monitoring team health and identifying students at risk of disengagement or overload.
- Generating triaged alerts and intervention options for faculty review and decision.
- Maintaining Contribution Ledgers for transparent academic assessment.
- Enabling student appeals through a formal, evidence-based process reviewed by faculty.
- Improving allocation accuracy across future semesters through the Semester Learning Profile.

Data is **never used for commercial purposes, advertising, or sharing with third parties** outside the specific integrations described in this policy.

---

### 8. Automated Decision-Making

AEGIS uses automated processing to produce several consequential outputs, including:

- Verified skill scores and Role DNA persona assignments.
- Team placement decisions based on the maximin fairness objective.
- Task allocation based on capacity and TaskFit scoring.
- Tier 1, Tier 2, and Tier 3 disengagement escalation responses, including automated task redistribution.

In accordance with the PDPA and the Institution's commitment to fairness, all automated placement decisions are:

- **Transparent:** The scoring factors and weighting used are published and available for review each semester.
- **Explainable:** Every placement carries its reasoning, accessible to the student and faculty.
- **Subject to human oversight:** Faculty may override any AEGIS recommendation. Override actions are logged with reasons.
- **Appealable:** Students have a formal appeals window after allocation is published. Appeals are reviewed by faculty — not by the AEGIS engine — against consistent, evidence-based rules.

No student will be permanently excluded or penalised solely by automated decision without human review.

---

### 9. Data Retention

| Data Category | Retention Period |
|---|---|
| Student profile and skill data | Duration of enrolment + 2 years |
| LMS grade sync records | Duration of enrolment + 2 years |
| Workspace behavioural telemetry | Duration of the academic semester + 1 year |
| Team Health Scores and Contribution Ledgers | Duration of enrolment + 2 years |
| Faculty override and intervention logs | 5 years (institutional audit purposes) |
| Google Drive files (team workspace) | Controlled by institutional Google Workspace policy |
| GitHub activity logs | Duration of the academic semester + 1 year |

After the applicable retention period, personal data is securely deleted or anonymised.

---

### 10. Data Sharing and Disclosure

AEGIS does not sell, rent, or trade personal data. Data is shared only in the following limited circumstances:

- **Within the Institution:** Faculty and administrators access only the data relevant to their assigned cohorts, enforced through Role-Based Access Control (RBAC).
- **Google Workspace:** Student workspace files are stored and managed via the institutional Google service account. Students authenticate via Google OAuth. Google's own Privacy Policy applies to data held within Google Drive.
- **GitHub:** Where the GitHub integration is enabled, contribution activity is accessed via GitHub OAuth. GitHub's own Privacy Policy applies to data held on GitHub.
- **Legal Obligation:** The Institution may disclose personal data if required by Sri Lankan law, court order, or a lawful request from a competent authority.

---

### 11. Data Security

The Institution implements the following measures to protect personal data processed through AEGIS:

- Role-Based Access Control: lecturers cannot access data outside their assigned cohorts; students cannot access data belonging to other teams.
- Google Drive file isolation: team folders are shared only with the relevant team members at the Google permission level. AEGIS does not expose file IDs belonging to other teams.
- Secure authentication via Google OAuth and GitHub OAuth.
- All sensitive scoring data (skill passports, derived scores) is stored server-side and not exposed in peer-facing UI.
- Regular security reviews in line with the Computer Crimes Act No. 24 of 2007.
- Autosave of all student onboarding inputs to prevent data loss from session interruptions.
- Allocation runs are deterministic and re-runnable with the same seed to support audit and recovery.

---

### 12. Your Rights Under the PDPA

Under the Personal Data Protection Act No. 9 of 2022, you have the following rights:

- **Right to be informed** — to know what data is collected and how it is used (fulfilled by this policy and onboarding disclosure).
- **Right of access** — to request a copy of the personal data AEGIS holds about you.
- **Right to rectification** — to request correction of inaccurate personal data.
- **Right to erasure** — to request deletion of your personal data, subject to the Institution's legitimate interest in retaining academic records.
- **Right to object** — to object to specific processing activities, where the legal basis is legitimate interest.
- **Right not to be subject to solely automated decisions** — to request human review of any automated allocation outcome (exercised through the formal appeals window).

To exercise any of these rights, contact: **[Data Protection Contact Email]**

The Institution will respond within 30 days in accordance with the PDPA.

---

### 13. Changes to This Policy

This policy may be updated periodically. Students and staff will be notified of material changes via their institutional email. Continued use of AEGIS after notification constitutes acceptance of the updated policy.

---

## Part 2 — General Platform Policy

### 1. Purpose

This General Platform Policy sets out the rules, obligations, and expectations governing all users of the AEGIS platform. It applies to students, lecturers, supervisors, and system administrators of [Institution Name].

---

### 2. User Eligibility and Account Registration

- AEGIS accounts are restricted to currently enrolled students and authorised staff of [Institution Name].
- Lecturer and supervisor accounts must be approved by a System Administrator before access is granted.
- Students self-register using their institutional credentials and must complete the full onboarding profile before allocation can proceed.
- Account sharing, impersonation, or use of another person's credentials is strictly prohibited and constitutes a violation of the Computer Crimes Act No. 24 of 2007.

---

### 3. Student Onboarding Obligations

Students must:

- Provide accurate, honest information during profile completion, including skill self-assessments, project preferences, working style, and capacity declarations.
- Complete all onboarding steps, including the scenario-based survey (T2), to ensure fair allocation.
- Grant Google OAuth access to enable workspace provisioning and activity tracking.
- Accept the Digital Team Contract at the point of team formation, committing to agreed meeting frequency, response times, and individual responsibilities.

Intentional misrepresentation of skills or availability is a breach of academic integrity and may result in disciplinary action under the Institution's academic conduct regulations.

---

### 4. Platform Use and Acceptable Conduct

All users of AEGIS must:

- Use the platform solely for legitimate academic capstone project purposes.
- Treat all team members, faculty, and administrators with respect within all AEGIS communication channels.
- Not attempt to reverse-engineer, manipulate, or interfere with the allocation engine, scoring system, or any other backend functionality.
- Not attempt to access data belonging to other students, teams, or cohorts.
- Not circumvent the task assignment system or submit work as their own that was completed by another student.

---

### 5. Workspace and Collaboration Rules

- Each student is responsible for completing tasks assigned to them within AEGIS. Task assignments are capacity-adjusted and reflect each student's declared availability.
- Completing tasks formally assigned to another student (Sympathy Carry) is detected by the system and will trigger an automated intervention and faculty notification.
- Students are expected to maintain active engagement with the workspace throughout the semester. Sustained inactivity triggers the 3-Tier Disengagement Escalation Protocol:
  - **Tier 1** (activity drop ≥ 40%): automated honest check-in message sent to student acknowledging that engagement appears to have dropped and asking if they need support.
  - **Tier 2** (6 consecutive days of zero input): non-critical tasks may be reassigned to maintain team progress; faculty is notified.
  - **Tier 3** (10 consecutive days of zero input): escalation to faculty for direct intervention and decision.
- Team chat messages within AEGIS are logged as engagement signals and are part of the platform record.
- Team roles (e.g. team leader, project manager) are not assigned by AEGIS. Teams self-assign roles among themselves after group formation is complete.
- All connected platforms — including Google Docs, Google Sheets, Google Slides, Google Calendar, and GitHub (where enabled) — are part of the monitored workspace. Activity on these platforms contributes to engagement signals.

---

### 6. Mid-Semester Changes — Faculty Responsibilities

When a mid-semester change event occurs (such as a student withdrawal, a late addition, or a significant team conflict), AEGIS will:

- Raise a structured alert in the Faculty Overwatch Control Room, clearly describing the event and its potential impact on the affected team.
- Present the faculty member with all available resolution options, their consequences, and any algorithmic recommendations. Options typically include:
  - **Recompute for affected team only:** AEGIS re-runs allocation for the affected team without disturbing any other teams.
  - **Manual reassignment:** Faculty manually moves a student to a different team or project, with AEGIS logging the override and reason.
  - **Merge or dissolve team:** Where a team has fallen below minimum viable size, merge with another team or dissolve and redistribute members.
  - **Absorb late registrant into skill gap:** Place a late-registering student into the team with the highest skill gap matching their profile.
  - **Batch late registrants:** Where multiple late registrants exist, form a new team among them with faculty-reviewed composition.

Faculty must select and log a resolution action. No change to team composition is made by AEGIS without an explicit faculty decision. The affected team is notified of any change after the faculty decision is made.

---

### 7. Faculty and Supervisor Obligations

Lecturers and supervisors must:

- Use AEGIS only in relation to student cohorts assigned to them by a System Administrator.
- Exercise oversight of AEGIS recommendations and make human judgement calls where the system flags exceptions or mid-semester change events.
- Treat all AEGIS-generated alerts, student data, and pre-composed intervention templates as confidential.
- Log the rationale for any override of an AEGIS recommendation.
- Conduct the appeals process fairly, applying consistent evidence-based criteria.
- Accept or deny student appeals with a written reason that is communicated back to the student.
- Not use platform data for any purpose outside the academic administration of capstone modules.

---

### 8. System Administrator Obligations

System Administrators must:

- Approve lecturer accounts only after verifying institutional authorisation.
- Configure academic years, semesters, departments, modules, and cohort assignments accurately.
- Not access student or lecturer data beyond what is necessary for platform administration.
- Maintain confidentiality of all system-level access credentials.

---

### 9. Appeals Process

After allocation results are published, a formal appeals window is opened. Students may challenge a placement by submitting a request through the AEGIS platform. Appeals are:

- Reviewed by the relevant faculty member, not by the AEGIS engine.
- Decided against consistent, published evidence-based criteria.
- Responded to with a written explanation — either approving the appeal with the resulting change, or denying it with a clear reason.
- Logged alongside any faculty override records for audit purposes.

The outcome of a successful appeal may result in team reassignment, role change, or task reallocation. AEGIS will recompute only the directly affected assignments.

---

### 10. Bias Monitoring and Fairness

The Institution commits to reviewing the AEGIS allocation engine each semester for evidence of systematic bias. This includes:

- Running a bias audit to check whether any identifiable group is repeatedly placed in lower-scoring teams.
- Publishing the scoring factors and weighting parameters used in each allocation run.
- Adjusting weights and parameters where review identifies unjustified disparities.

The maximin fairness objective — maximising the skill floor of the weakest team so that all teams are as equal as possible — is the core design principle of the formation algorithm. AEGIS does not group weaker students together. All teams are formed to be balanced in skill composition.

---

### 11. Intellectual Property

All project work, documents, and deliverables produced by students within the AEGIS workspace remain the intellectual property of the respective students and the Institution in accordance with the Institution's IP policy. AEGIS does not claim any rights over student work product.

---

### 12. Consequences of Policy Violation

Violations of this policy may result in:

- Formal academic misconduct proceedings under the Institution's regulations.
- Suspension or permanent revocation of AEGIS platform access.
- Referral to Sri Lanka law enforcement where the violation constitutes an offence under the Computer Crimes Act No. 24 of 2007 or any other applicable law.

---

## Part 3 — Information Gathering Policy

### 1. Purpose

This policy governs specifically how AEGIS collects, triangulates, and processes information about students for the purposes of skill verification, team formation, and behavioural monitoring. It provides full transparency on every data collection channel and mechanism used by the platform.

---

### 2. Consent and Disclosure at Onboarding

Before any data collection begins, every student is presented with:

- A clear summary of all data sources AEGIS will access (LMS grades where available, scenario-based survey, Google Drive activity, GitHub activity where enabled, workspace chat, Google Workspace activity).
- An explanation that workspace and platform engagement are monitored throughout the semester to support their academic progress and to ensure fair contribution assessment within teams.
- An explanation of why engagement is tracked: to protect students from being disadvantaged by disengaged teammates, to identify students who may need support before problems escalate, and to provide a fair, evidence-based record for grade-related decisions.
- An explanation that skill self-reports are verified against a scenario-based assessment and may be adjusted by the system using a transparent confidence factor.
- An explanation that placement decisions are explained to the student after allocation, and that a formal appeals window is available.
- A requirement to grant Google OAuth consent (and GitHub OAuth where applicable) before workspace access is enabled.

No allocation process begins for a student who has not completed onboarding and provided the required consents.

---

### 3. The Skill Verification Channels

AEGIS does not rely on self-reported data alone. Skill verification draws on two independent channels:

**Channel T1 — LMS Grade Sync (where available)**
Academic grades and attendance rates are pulled directly from the institutional LMS where available. This provides hard, verified academic history used as a supporting evidence base for skill scoring. Data pulled includes: module grades for prerequisite and relevant courses, and attendance rate (0.0 to 1.0 scale). Where LMS data is unavailable, skill scoring proceeds on T2 alone.

**Channel T2 — Scenario-Based Survey**
Students complete a structured scenario-based assessment during onboarding. The assessment uses forced-choice technical and situational questions to measure actual competency across four skill pillars: Technical Architecture, User Experience Design, Project Management, and Communication. The survey is intentionally not disclosed as a skill check at the time of completion so that students respond to scenarios naturally rather than strategically — this ensures the results reflect genuine capability. Students are informed at onboarding that their placement will be based partly on a capability assessment, and their placement rationale is explained to them after allocation.

> **Why we do not disclose the assessment nature in advance:** Research and practical experience show that when students know a survey is measuring their skills for placement, they are more likely to overstate capabilities they do not have. The scenario format is designed to capture genuine competency rather than stated competency. This approach is used in combination with independent evidence triangulation and a post-allocation explanation to the student, ensuring both accuracy and fairness.

---

### 4. Skill Scoring and the Confidence Factor

Where LMS data is available, skill scores are calculated using a transparent confidence-weighted formula:

**Â = L × C**

Where:
- **Â** = the adjusted score used for allocation
- **L** = the self-reported or survey-assessed score
- **C** = a confidence factor derived from the consistency between the student's survey performance (T2) and their LMS academic record (T1)

This is not a binary override. The confidence factor applies a smooth, graduated discount where the survey score diverges significantly from academic evidence. Students who have no LMS data available are assigned a neutral confidence factor and are not penalised for the absence of prior academic records.

Where LMS data is entirely unavailable, the T2 survey score is used directly and weighted accordingly.

The system never entirely discards a student's self-report; it weights it proportional to the available corroborating evidence.

---

### 5. The Student Skill Profile

Each student's verified inputs are compiled into an internal skill profile used by the allocation engine. Students are informed that this profile exists, what categories of data it contains, and what their placement outcome is based on. The raw scores used for allocation are not shown to peers or other students. Faculty and administrators with appropriate access may view skill profile data for their assigned cohorts only.

The Student Skill Profile contains:

- Role DNA Persona
- Verified Skill Matrix (four pillars, 0–10 scale)
- Capacity Allowance Hours
- Confidence Factor per pillar

Disengagement risk is not assessed at intake. It is computed only from live, in-project behavioural signals after the project has started, and any Tier 3 escalation requires human faculty review.

---

### 6. Workspace Behavioural Monitoring

Following team formation and workspace provisioning, AEGIS monitors student engagement through the Google Drive Activity API on a 72-hour polling cycle. The following signals are collected:

| Signal | Description |
|---|---|
| Edit events | Who made edits and when |
| Revision count | Number of revisions contributed per student |
| Active editing time | Approximate time spent actively editing (not passive tab-open time) |
| View events | File opens without editing (logged separately and not treated as contribution) |

Where GitHub integration is enabled, the following additional signals are collected:

| Signal | Description |
|---|---|
| Commit events | Number and timing of commits |
| Pull request activity | PRs opened, reviewed, and merged |
| Issue activity | Issues created, commented on, and closed |

AEGIS additionally logs:

- Task completion events (tasks marked done within the platform).
- Workspace chat messages (volume and frequency, not content-analysed for meaning beyond engagement signal).
- Meeting attendance records pulled from the workspace calendar.
- Activity within Google Docs, Sheets, and Slides connected to the team workspace.

All signals are used exclusively to compute Team Health Scores, Contribution Scores, and to operate the Disengagement Escalation Protocol. Activity signals are blended with peer evaluation inputs (where the lecturer enables peer review) to ensure contribution assessment is not based solely on automated metrics. They are not used for any purpose outside academic administration of the capstone module.

---

### 7. Data Minimisation Principles

AEGIS applies the following data minimisation rules:

- Only work-product metadata is collected. The content of student documents is not read or analysed by AEGIS. Document analysis is limited to activity signals (who edited, when, how many revisions).
- Sensitive personal attributes (ethnicity, religion, gender, disability status, socioeconomic background) are explicitly excluded from all scoring computations.
- No sociometric vouch identities are collected or used in scoring.
- No biometric data is collected.
- No location data is collected.
- Passive tab-open time is not counted as engagement. Only active editing events qualify.
- Contribution quality signals (e.g. peer evaluation, milestone-linked deliverable quality) are used alongside volume signals to prevent gaming through superficial activity.

---

### 8. Week 2 Calibration Check

In week 2 of the capstone semester, a standard introductory assignment is deployed to all teams. Successful independent completion of this task validates that the student's skill profile is consistent with their actual working capability. If a student fails to complete it independently, a skill anomaly flag is sent to the faculty dashboard for human review. A backend profile adjustment may be initiated before primary milestones begin.

Students are informed at onboarding that an early validation task will be used to confirm skill-profile accuracy.

---

### 9. Sympathy Carry Detection

AEGIS monitors file contribution attribution against explicit task assignments. Where a student's contribution ratio on a task assigned to a different student reaches or exceeds 0.95, the system:

- Halts submission completion approval for that task.
- Logs an automated workload attribution warning.
- Pushes a workspace prompt to the contributing student to re-delegate the work.

This mechanism protects both the carrying student (burnout risk) and the assigned student (academic integrity of individual contribution).

---

### 10. Faculty Access to Collected Data

Faculty and supervisors access student data exclusively through the Faculty Overwatch Control Room. This dashboard presents:

- Triaged alerts ranked by risk level (Critical, Warning, Stable).
- Mid-semester change event alerts with all available resolution options for faculty decision.
- Team Health Scores and component breakdowns.
- Pre-composed intervention message templates for flagged situations (sent as honest, transparent communications — not disguised routine messages).
- Individual Contribution Score breakdowns per team member.
- Appeal submissions from students, with the faculty member required to respond with an acceptance or denial and written reason.
- A bias audit panel showing whether any identifiable group within the cohort is receiving systematically lower placements.

Faculty do not have access to raw API telemetry logs. All data is pre-processed and presented in human-readable, actionable form. Faculty access is scoped strictly to their assigned cohorts.

---

### 11. Review and Audit

The information gathering practices described in this policy are reviewed each semester by [Institution Name] to ensure:

- Continued compliance with the Personal Data Protection Act No. 9 of 2022.
- That no scoring factor or data source introduces unjustified bias, verified through the bias audit dashboard.
- That data minimisation principles remain in effect as the platform evolves.

Any changes to the information gathering practices described here will be disclosed to students via updated onboarding consent disclosures before taking effect.

---

*These policies are maintained by [Institution Name]. For queries, contact [Data Protection Contact Email].*
*Last updated: [Insert Date]*
