# Setup

This covers two things: running the prototype as it is today, and setting up a development environment for the production app when that work begins.

## Running the prototype

The prototype is a single HTML file with no build step.

1. Get the code.

   ```bash
   git clone <your-repo-url>
   cd aegis
   ```

2. Open the file.

   Double-click `aegis-platform-v2.html`, or open it from your browser with File then Open.

That is all that is needed. The animations and fonts load from a CDN, so a connection gives the full experience. Offline, the interface still works without the entrance motion.

### Running from a local server

A local server is handy when you want to test on a phone over the same network, or avoid any browser restrictions on local files.

```bash
# Python (already installed on most machines)
python3 -m http.server 8080

# or Node
npx serve .
```

Open `http://localhost:8080/aegis-platform-v2.html`. To test on a phone, use your computer's local IP in place of localhost.

### Trying the flows

- Let the boot sequence run, or press Skip.
- Pick a role on the login screen, then tick the three consent boxes.
- Use the role switcher (top right on desktop, inside the menu on mobile) to move between student, faculty, and admin.
- Open the bell for notifications, the magnifier for search, and the gear for preferences.
- On the faculty side, try Run allocation to see the engine animation, and resolve an alert.

## Setting up the production environment

This section is for when the Next.js app is built. It does not apply to the prototype.

### Requirements

- Node.js 20 or later
- A Supabase project
- A Google Cloud project with OAuth and the Drive API enabled
- A Resend account for email

### Steps

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create your environment file.

   ```bash
   cp .env.example .env.local
   ```

   Fill in the Supabase, Google, and Resend values. Keep `SUPABASE_SERVICE_ROLE_KEY` and the Google secret server-side only.

3. Set up the database.

   Apply the schema in Supabase (users, cohorts, teams, skills, scores, activity, alerts, appeals). Row-level security should restrict students to their own records and faculty to their assigned cohorts.

4. Start the dev server.

   ```bash
   npm run dev
   ```

   The app runs on `http://localhost:3000`.

### Common problems

- Sign-in fails: check that the OAuth redirect URI matches `APP_BASE_URL`.
- Drive polling returns nothing: confirm the service account has access to the shared workspace folders.
- Email does not send: verify the Resend domain and `EMAIL_FROM`.
