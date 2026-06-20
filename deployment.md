# Deployment

## Deploying the prototype

The prototype is a static file, so any static host works. There is nothing to build.

### Netlify or Vercel

1. Connect the repository.
2. Leave the build command empty.
3. Set the publish or output directory to the repository root.
4. Deploy.

If the host expects an `index.html`, either rename `aegis-platform-v2.html` to `index.html` or add a small redirect.

### GitHub Pages

1. Push the repository to GitHub.
2. In Settings then Pages, set the source to the main branch and the root folder.
3. Open the published URL and add `/aegis-platform-v2.html` if it is not the index.

### Cloudflare Pages

Same idea: connect the repo, no build command, output directory is the root.

## Deploying the production app

This applies once the Next.js app exists.

### Front end on Vercel

1. Import the repository into Vercel.
2. Vercel detects Next.js and sets the build automatically.
3. Add the environment variables from `.env.example` in the project settings. Mark the secret values (service role key, Google secret, Resend key) as sensitive and keep them out of any `NEXT_PUBLIC` variable.
4. Set `APP_BASE_URL` to the production domain.
5. Deploy.

### Backend on Supabase

1. Use a production Supabase project, separate from development.
2. Apply the schema and row-level security policies.
3. Restrict the service role key to server-side use only.
4. Schedule the Drive activity poll on the interval set by `DRIVE_POLL_INTERVAL_HOURS`.

### After each deploy

- Sign in once with each role and confirm the dashboards load.
- Send a test email through Resend.
- Trigger a small allocation run and confirm the audit log records it.
- Check the app on a phone, not only desktop.

### Rollback

Vercel keeps previous deployments. If a release causes problems, promote the last working deployment while you investigate.
