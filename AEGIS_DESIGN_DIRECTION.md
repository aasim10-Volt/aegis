# AEGIS — Design Direction & Inspiration
### CIPHER 2.0 · Phase 2 Prototype · UI guidance

> **Reframe first.** The judging slide marks animations and polish as wasted time, and
> UI is **not** a scoring criterion. So the design job for AEGIS is **not flair — it's
> legibility of the algorithm.** Judges must follow `input → score → match → monitor` and
> *see the logic working*. A calm, dense, information-first dashboard does that. A flashy
> one actively hurts you — it reads as effort spent in the wrong place. Design "boring on
> purpose" and spend the saved time on the engine.

---

## Recommendation (TL;DR)

**shadcn/ui dashboard shell + Tremor for the data viz, in Linear/Vercel restraint.**
Zero bespoke design, looks serious and credible, ships in hours not days.

Keep the **Serendib** palette for Kawi. AEGIS wants **institutional-neutral**, not characterful.

---

## Three directions (pick #1's aesthetic, #2/#3 for speed)

### 1. The "serious tool" look — *recommended aesthetic*
**Inspiration:** Linear, Vercel, Resend.
Restrained neutral base (slate/zinc), one functional accent, generous whitespace,
excellent typography. Severity communicated by a single color cue, not decoration.
This makes a governance product look credible instantly, and it's the fastest to ship
because it's mostly about *removing* things.

### 2. Analytics-dashboard look — *fastest data viz*
**Inspiration / tool:** Tremor (`tremor.so`).
Hands you the exact primitives AEGIS needs, pre-built:
- `BarList` → contribution score per member
- `ProgressBar` → health sub-bars (workload / milestone / engagement)
- `Tracker` → ghosting activity timeline (one colored cell per day = your Tier 1/2/3 visual)
- KPI cards with deltas → the top stat row

### 3. Copy-paste dashboard shell — *fastest scaffold*
**Tool:** shadcn/ui → Blocks → `dashboard-01` (`ui.shadcn.com`).
A credible faculty dashboard shell in minutes; drop your data in. You already build with
shadcn + Tailwind v4, so this is effectively free.

---

## Patterns worth getting right (they make the *logic* visible)

| Pattern | What it shows | How to build it |
|---|---|---|
| **Evidence weighting** *(hero)* | The Dunning-Kruger correction | Paired bars: faint "declared" ghost bar behind a solid "adjusted" bar; C-factor as a chip (`1.0 / 0.8 / 0.6 / 0.5`). Render the **C=0.5** case in amber. Legible in one glance. |
| **Maximin balance** | The floor being lifted | Small multiples — one mini skill-coverage bar per team — with the **weakest team highlighted**. Maximin is about the floor, so show the floor. |
| **Alert triage inbox** | Conflict + governance output | Linear-style list; severity as a **left border color** (grey/amber/red = INFO/WARNING/CRITICAL); click a row to expand context + the pre-written check-in template. |
| **Pipeline stepper** *(highest demo value)* | The input→output flow | Horizontal `Input → Score → Match → Form → Monitor` strip that lights up as `/run` executes. Makes the flow undeniable to judges — worth one small investment. |

---

## Palette & type (ship-fast tokens)

- **Base:** neutral slate / zinc
- **Healthy / action:** emerald
- **Warning:** amber
- **Critical:** red
- **Numbers, scores, IDs:** a mono — JetBrains Mono or Geist Mono

The shadcn default theme gives you most of this for free.

**Severity → color mapping (use consistently everywhere):**

```
INFO      → slate / grey
WARNING   → amber      (also: the C=0.5 evidence case, burnout/sympathy-carry flags)
CRITICAL  → red        (Tier 3 ghosting, missed milestone, confirmed poached task)
HEALTHY   → emerald    (health ≥ 75)
AT RISK   → amber      (health 50–74)
```

---

## What NOT to spend time on

- Fancy animations / transitions / parallax
- Custom illustration or branding work
- A bespoke design system (use shadcn defaults)
- Pixel-polishing screens that aren't the demo path

Spend that time on the engine. **55 of 100 marks are the pure algorithm — design only has
to make those marks *visible*, not decorate them.**
