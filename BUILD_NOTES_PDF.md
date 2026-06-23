# Build Notes — CIPHER 2.0 Documentation PDF

**Produced file (exact name, verified char-for-char):** `CIPHER2_theametuers_Documentation.pdf`
**Throwaway source:** `CIPHER2_theametuers_Documentation.html` (the HTML the PDF was rendered from)
**Build method:** standalone HTML → headless Chrome (`--headless=new --no-pdf-header-footer --print-to-pdf`). UTF-8; no LaTeX.
**Length:** 4 pages (A4). **Status:** unstaged / not committed — left for your review.
**Glyph check (rendered correctly in the PDF):** `Â = L × C`, `≥`, `×`, `→`, `↔`, `≠`, `§` — no mojibake.

---

## Every figure / claim used and its source

| Figure / claim in PDF | Value | Source |
|---|---|---|
| Confidence factors | verified 1.0 / portfolio 0.8 / self-report 0.6 / contradicted 0.5 | `aegis/…/config.py` → `CONFIDENCE` |
| Evidence formula | Â = L × C | `config.py` header + `aegis/api/main.py` (`corrected` flag) |
| STU_08 correction | declared 5.0, contradicted → Â = 5.0 × 0.5 = 2.5; lands in P_05 | `aegis/seed/seed.json` (`c05_hero` note + skill entries) + **live /run** |
| Duplicate gate | cosine ≥ 0.75 | `config.py` → `DEDUPE_THRESHOLD` |
| Duplicate pair | P_02 / P_03 flagged at 0.96 | pair in `seed.json` (`duplicate_pair`); **0.96 score = live /run** |
| Matching | Abraham–Manlove SPA, preference-honouring | project design / case material |
| Formation | maximin floor-lifting | engine design / case material |
| Health-band labels | P_04 Healthy / P_01 At-Risk / P_05 Critical | `seed.json` (`health_bands` note) |
| Health-band scores | 84 / 69 / 41 | **live /run (your reported values)** |
| Monitoring window | 14-day sprint | `config.py` → `MONITORING_WINDOW_DAYS` |
| Ghosting Tier-3 | 10+ zero-input days | `config.py` → `GHOST_TIER.tier3_days` |
| STU_07 ghost | 0 events / 14 sim-days (P_05) | `seed.json` (`ghosting_tier3` note) |
| Sympathy-carry | ≥ 0.95 of another's tasks | `config.py` → `SYMPATHY_RATIO`; case STU_01↔STU_05 in `seed.json` |
| Burnout | utilisation ≥ 2× team avg; STU_01 = 10 events | `config.py` → `BURNOUT_MULT`; `seed.json` (`burnout` note) |
| Cohort headline | 70-student cohort → 15 teams + 1 exception pool | **live /run (your reported values)** |
| BOLA / RLS / audit / role controls | OWASP API1:2023, 3-tier RLS, hash-chained audit, server-side role | `SECURITY_REVIEW.md` |
| Drive scopes | `drive.file` + `drive.activity.readonly`, OAuth-as-user | `lib/google/auth.ts` → `GOOGLE_SCOPES` |
| Secret hygiene / synthetic data | no secrets in git history; RFC 2606 `@aegis.test` | `PUBLICATION_CHECKLIST.md` |
| LMS default / migration & Drive caveats | C = 0.6 default; non-atomic migrations; consumer-Gmail Drive constraint | Integration Setup Guide + engineering caveats |

## [FIG] placeholders for you to fill (live-dashboard screenshots)
All three are full-size dashed boxes on page 3, captioned and sized for drop-in:
- **[FIG 1]** Pipeline stepper — live dashboard (intake → de-dup → match → form → monitor)
- **[FIG 2]** Team health bands — P_04 Healthy 84, P_01 At-Risk 69, P_05 Critical 41
- **[FIG 3]** Alert inbox — STU_07 ghost (Tier-3) + STU_01/STU_05 carry & burnout

To replace: edit the `.figbox` blocks in the HTML (insert an `<img>`), then re-run the Chrome
print command at the top of this file. Capture from the **live-data dashboard** only — `lib/sample-run.ts`
placeholder numbers (84/68/42, 0.91, P_A/P_C) were deliberately excluded and must not appear.

## Figures to confirm against your live run (not independently re-verifiable from tracked files)
No `[VERIFY]` markers were left in the PDF — but three values come **only** from your live /run and
could not be cross-checked against committed data. You confirmed them authoritative; flagging for a final eyeball:
- **Health scores 84 / 69 / 41** (band *labels* are grounded in `seed.json`; the *numbers* are live-run).
- **15 teams + 1 exception pool** (70-student cohort outcome).
- **P_02 / P_03 cosine = 0.96** (the pair is grounded; the exact 0.96 score is live-run).

If any differ from tomorrow's screenshots, change them in the HTML and re-render.

## Note
- A design-lint hook flagged the formula callout's left accent border (`.formula`, line 28). Left
  intentionally — it's a conventional print formula/quote rule, not a UI card; classified as a false
  positive. No ignore directive was persisted.
- No working code was touched this gate. Only `CIPHER2_theametuers_Documentation.{html,pdf}` and this file were created.
