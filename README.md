# AEGIS

AEGIS is a capstone team platform built for the CIPHER 2.0 challenge at the Informatics Institute of Technology. It helps a faculty form balanced project teams from real evidence, then keeps an eye on each team through the semester so no single student ends up carrying the group.

This repository currently holds the working front-end prototype. It is a single, self-contained web page that demonstrates the full experience across all three roles (student, faculty, and admin). The production build described in the architecture notes is the next step, not what runs here yet.

## What it does

The idea behind AEGIS is simple. Group projects fall apart in predictable ways: one person does everything, someone quietly disappears, two teams pick the same idea, or a student gets placed somewhere that does not match their skills. AEGIS tries to handle each of those problems with a clear, explainable process instead of guesswork.

There are three sides to the product.

Students see their own dashboard: their tasks, their contribution score, their team's health, and the reasoning behind their placement. Everything the system tracks about them is shown to them, and they can appeal a placement if it feels wrong.

Faculty get an overview of every team they supervise, an alert inbox for problems that need attention, and a one-click team formation run. Nothing the system flags turns into a decision on its own. A lecturer reviews it first.

Admins manage users, cohorts, and the scoring rules, and can see the health of the underlying services.

## Key features

- Role-based experience for students, faculty, and admins, switchable from one screen
- Evidence-weighted skill scoring, where a declared skill is adjusted by how well it can be backed up
- Team formation using a maximin objective (lift the weakest team) combined with stable preference matching
- Health monitoring that flags ghosting, uneven workloads, and burnout on a regular cycle
- A duplicate-idea gate so two teams do not unknowingly build the same project
- A consent step and data-governance model written around Sri Lanka's PDPA No. 9 of 2022
- An appeals window so placements can be challenged before they are final

## Tech stack

This prototype is deliberately lightweight so it runs anywhere with no build step.

- HTML, CSS, and plain JavaScript in a single file
- anime.js for entrance and number animations, loaded from a CDN
- Tabler Icons and Google Fonts (Space Grotesk, Inter, JetBrains Mono), also from a CDN

The production version is planned around a typical modern stack. The screens already reference these services, and the environment file is set up for them.

- Next.js for the front end
- Supabase (Postgres and Auth) for data and sign-in
- Google Drive API for activity monitoring, read by metadata only
- Resend for transactional email such as faculty check-ins

See `docs/architecture.md` for the full picture.

## Folder structure

```
.
├── aegis-platform-v2.html     The current interactive prototype (open this)
├── aegis-mockup.html          The earlier landing-page concept
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── .env.example
├── .gitignore
└── docs
    ├── setup.md               How to run it and set up a dev environment
    ├── deployment.md          How to publish it
    └── architecture.md        How the system is designed
```

When the production app is built, the front end will move into a standard Next.js layout (`app/`, `components/`, `lib/`). That structure is described in the architecture notes rather than created early.

## Setup

You do not need to install anything to view the prototype.

1. Clone or download the repository.
2. Open `aegis-platform-v2.html` in any modern browser.

The animations use a CDN, so an internet connection gives the full experience. Without one, the interface still works; it just skips the entrance motion.

If you prefer to run it from a local server (useful for testing on a phone on the same network):

```bash
# Python
python3 -m http.server 8080

# or Node
npx serve .
```

Then open `http://localhost:8080/aegis-platform-v2.html`.

Full instructions, including the planned production setup, are in `docs/setup.md`.

## Environment variables

The prototype needs none. The variables below are for the planned backend and are listed in `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key for the browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key, never exposed to the browser |
| `GOOGLE_OAUTH_CLIENT_ID` | Sign-in with the institutional Google account |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth secret, server only |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | Service account JSON for Drive activity polling |
| `RESEND_API_KEY` | Email delivery for faculty check-ins |
| `APP_BASE_URL` | Public URL of the deployed app |

Copy the example file before filling it in:

```bash
cp .env.example .env.local
```

## Development commands

For the current prototype there is no build pipeline. These are the commands you will use once the Next.js app exists. They are included so the documentation matches the planned setup.

```bash
npm install        # install dependencies
npm run dev        # start the dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # check code style
```

## Deployment

The prototype is a static file, so it can go on any static host: Netlify, Vercel, GitHub Pages, or Cloudflare Pages. Point the host at the repository and set the file as the entry page. There is nothing to compile.

The production app will deploy on Vercel with Supabase as the backend. Step-by-step notes for both are in `docs/deployment.md`.

## Future improvements

- Build the real Next.js front end and connect it to Supabase
- Replace the in-memory prototype state with live data and persistence
- Add automated tests for the scoring and matching logic
- Add a proper audit log view for every allocation run
- Add a dark theme that respects the system setting
- Run a full accessibility audit and add keyboard support to every interactive element
- Add an export of the contribution ledger for grade-dispute records

## Team

AEGIS was built by Team Amateurs for CIPHER 2.0 at the Informatics Institute of Technology.

## License

Released under the MIT License. See `LICENSE`.
