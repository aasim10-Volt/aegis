# AEGIS Design System

A faculty governance dashboard for capstone allocation. The design's single job:
let a lecturer see **which teams need attention and why**, and follow the engine's
reasoning end to end. Warmth and craft come from the reference; trust comes from
restraint.

---

## What was taken from the reference — and what wasn't

The "Course" reference is consumer EdTech. AEGIS handles student data under PDPA, so
it borrows the **structure**, not the **costume**.

| Borrowed (structure & craft) | Rejected (costume) |
|---|---|
| Three-column IA: nav · workspace · right rail | Rainbow multi-colour cards |
| Floating cards, large radius, soft layered shadows | Illustration-heavy, playful tone |
| Generous whitespace, clear stat chips | High saturation as default |
| Progress donuts → health / contribution rings | Course-marketplace voice |
| Weekly planner → milestone / activity timeline | — |

**Colour philosophy:** one confident indigo brand accent, used sparingly (primary
action, active nav, focus). Everything that carries *data* uses a disciplined
semantic palette (jade / amber / rose). Most of the UI rides on spacing, type, and
hierarchy — not colour. This is how Linear, Stripe, and Mercury read premium.

---

## Install

```bash
# stack: Next.js 15 · Tailwind v4 · shadcn/ui
npm i framer-motion lucide-react
npx shadcn@latest init        # if not already set up
```

1. Replace `app/globals.css` with the one in this bundle (light + dark tokens).
2. Make sure `@/lib/utils` exports `cn` (shadcn default).
3. Drop the four signature components into `components/aegis/`.
4. Wrap the app in `next-themes` (`ThemeProvider attribute="class"`) for dark mode.
5. Load fonts (Plus Jakarta Sans, Inter, JetBrains Mono) via `next/font`.

One animation library only: **Framer Motion**. No GSAP, no Anime.js — Framer covers
page transitions, hover, layout shifts, and number count-ups, and a single library
means no timeline fights and a third of the bundle.

---

## Colour — semantic, not decorative

| Token | Light | Role |
|---|---|---|
| `background` | cool grey-blue `#F4F6FB` | app canvas |
| `card` | white | every floating surface |
| `foreground` | slate `#1E293B` | primary ink |
| `muted-foreground` | slate `#64748B` | metadata, labels |
| `primary` | indigo `#4F46E5` | primary action, active nav, focus |
| `border` | `#E2E8F0` | hairlines only — never harsh |

**AEGIS status palette (the only place colour is allowed to mean something):**

| Band / severity | Token | Hue |
|---|---|---|
| Health ≥ 75 · INFO resolved | `healthy` | jade `#10B981` |
| Health 50–74 · WARNING · C = 0.5 | `at-risk` | amber `#F59E0B` |
| Health < 50 · CRITICAL | `critical` | rose `#E11D48` |
| Neutral signal | `info` | sky `#0EA5E9` |
| Secondary data series | `chart-5` | violet `#8B5CF6` (sparingly) |

Rule: if a colour appears, it must answer "what does this mean?" Decorative colour
is a bug.

---

## Typography

Deliberate pairing, not a single neutral family:

- **Display / headings** — Plus Jakarta Sans (600/700), tight tracking (`-0.018em`). Friendly geometric; bridges the reference's warmth and enterprise polish.
- **Body / UI** — Inter (400/500).
- **Data / scores / IDs** — JetBrains Mono, tabular numerals (`.nums` class). Every metric is mono so columns of numbers align and read as data.

| Step | Size / weight | Use |
|---|---|---|
| Display L | 28–32 / 700 | page title ("Allocation overview") |
| Display M | 20–22 / 600 | section header |
| Body | 14 / 400–500 | default text |
| Label | 12–13 / 500 | card labels, nav |
| Meta | 11 / 400 | timestamps, hints (mono where numeric) |

---

## Space · radius · elevation · motion

- **Spacing** — 4px base; cards pad `20–24px`; column gap `16px`; section rhythm `24–32px`.
- **Radius** — base `14px`; cards `rounded-[1.25rem]` (20px) for the floating-pill feel; chips/pills fully rounded.
- **Elevation** — four soft, cool-tinted, low-alpha shadows (`shadow-sm→xl`). Floating cards use `shadow-card` (md). No hard 1px box-shadows.
- **Motion tokens** — durations `fast 150 / base 220 / slow 320 / slower 480 ms`; easings `standard`, `out-quint` (entrances), `emphasized`.

**Framer Motion patterns (the whole strategy):**

| Where | Pattern |
|---|---|
| Page / route | fade + 8px rise, `out-quint`, 220ms |
| Card hover | `y: -2`, shadow lift, 150ms |
| Active nav | shared `layoutId` indicator (spring) |
| Numbers | `animate()` count-up on mount, ~0.9s |
| Stagger lists | `staggerChildren: 0.04` |
| Modals | scale `0.96→1` + backdrop fade |

`prefers-reduced-motion` is honoured globally in `globals.css` and in every component
(`useReducedMotion`).

---

## Component inventory

**From shadcn (use as-is, themed by the tokens):** Button, Card, Badge, Tabs, Table,
Dialog, Dropdown, Input, Select, Tooltip, Avatar, Separator, Skeleton.

**Signatures (in this bundle — the pieces that carry the language and aren't free):**

| Component | Maps to | Marks it earns |
|---|---|---|
| `PipelineStepper` | Verify→Dedupe→Match→Form→Monitor | makes input→output flow undeniable in the pitch |
| `EvidenceBar` | Â = L × C | the Dunning-Kruger correction, visible in one glance |
| `HealthRing` | team health / contribution score | the reference's donut, on real data |
| `AppShell` | three-column layout + responsive | the structural backbone |

Still to build off these tokens: `AlertRow` (severity left-border, expandable, with
the pre-written check-in template), `StatCard` (KPI chip like the reference's
"12 Enrolled"), `TeamCard`, `MaximinBars` (small-multiples of team skill coverage,
weakest highlighted).

---

## Layout

```
┌──────────┬─────────────────────────────────┬──────────────┐
│ SIDEBAR  │  MAIN WORKSPACE                  │  RIGHT RAIL  │
│ (floating)│  ┌─ PipelineStepper ─────────┐  │  Alerts      │
│  logo    │  │ Verify Dedupe Match …      │  │  Activity    │
│  nav     │  └───────────────────────────┘  │  Tasks       │
│  · Overview │ ┌ stat ┐ ┌ stat ┐ ┌ stat ┐  │  AI assist   │
│  · Teams │  └──────┘ └──────┘ └──────┘     │  (optional)  │
│  · Alerts│  ┌─ TeamCards / table ───────┐  │              │
│  · Pipeline│ │ health rings · evidence   │  │              │
│  profile │  └───────────────────────────┘  │              │
└──────────┴─────────────────────────────────┴──────────────┘
```

**Responsive breakpoints:**

| Width | Layout |
|---|---|
| ≥ 1280 (xl) | all three columns |
| 768–1279 (md) | sidebar + main; rail content folds into main |
| < 768 | main only; fixed **bottom nav**; sidebar via drawer; cards stack |

Mobile-first: design the single-column stack first, add columns up.

---

## Dark mode

Deep slate-navy canvas (`#0F172A`), lifted cards, same hues at raised lightness,
brighter indigo. Driven by `.dark` on `<html>` (next-themes). Both modes ship in
`globals.css` — no extra work.

---

## Accessibility (quality floor, non-negotiable)

- Visible keyboard focus everywhere (`:focus-visible` → soft indigo ring).
- Status never by colour alone — always paired with a label ("At risk", "CRITICAL").
- Body contrast ≥ 4.5:1; large text ≥ 3:1. Verify amber-on-white for small text; use
  `at-risk-foreground` ink on amber fills, not amber text on white for body copy.
- `prefers-reduced-motion` honoured globally.
- Semantic landmarks (`aside`, `main`, `nav`), `aria-current` on active nav.

---

## Copy

Name things by what people control, not how the system is built.

| Don't | Do |
|---|---|
| "Trigger allocation engine" | "Run allocation" |
| "Telemetry anomaly detected" | "Team 12 — 11 days no activity" |
| "Submit" | "Run allocation" / "Send check-in" |
| "Engagement signal rate: 0.0" | "No activity this week" |

Active voice, sentence case, no filler. An action keeps its name through the flow:
the button that says "Run allocation" produces a toast that says "Allocation complete."

---

## Build order (fits the 6-day plan)

1. `globals.css` + fonts + `AppShell` → the frame stands up. (½ day)
2. `PipelineStepper` wired to the real `/run` endpoint → the demo spine. (½ day)
3. `HealthRing` + `EvidenceBar` + `StatCard` on seed data. (1 day)
4. `AlertRow` inbox + `MaximinBars`. (½ day)
5. Dark mode pass + responsive + a11y sweep. (½ day)

Spend boldness in one place: the **PipelineStepper** is the signature. Keep everything
around it quiet. The dashboard's job is to make the engine legible — that's the only
thing the presentation marks reward.
