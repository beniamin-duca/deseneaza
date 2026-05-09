# Admin Riza — operator notes

The admin lives at `/admin/povesti`. It lets the owner edit any of the
50 baked-in story texts (title, scripture ref, summary, paragraphs,
accent color, template URL) without redeploying. Edits persist in
Vercel KV.

## One-time setup

1. **Vercel KV**
   - Vercel dashboard → project → Storage → Create database → KV (Upstash Redis).
   - Connect it to the project. Vercel auto-injects `KV_REST_API_URL`,
     `KV_REST_API_TOKEN`, `KV_URL` into the project's environment.

2. **Admin secrets**
   - Project Settings → Environment Variables → add:
     - `ADMIN_PASSWORD` — strong password, ≥ 16 characters.
     - `ADMIN_SECRET` — generated via `openssl rand -hex 32`.
   - Apply to all environments (Production, Preview, Development).

3. **Local development**
   - After the KV integration is connected, run:
     ```
     vercel env pull .env.local
     ```
   - This pulls every env var (KV creds + ADMIN_*) into `.env.local`.
   - Restart `pnpm dev`.

If `ADMIN_PASSWORD` / `ADMIN_SECRET` are unset, the admin login page
shows "Admin nu este configurat". If KV creds are missing, the public
site still works on the seed values; admin save returns a 503.

## Day-to-day usage

- Visit `/admin/login`, enter the password.
- Cookie lasts 7 days. Click **Iesi** to log out earlier.
- The list at `/admin/povesti` shows all 50 stories with an "Editat"
  badge for ones with overrides.
- Open a story → edit any field → **Salveaza** → public pages fetch
  the new merged version on next visit.
- **Reseteaza la valoarea implicita** removes the override for that
  story; the public site falls back to the seed in `lib/stories.ts`.

## Rotating the password

Change `ADMIN_PASSWORD` in Vercel env vars and redeploy. Existing
admin sessions remain valid until they expire (7 days) — to invalidate
them immediately, also change `ADMIN_SECRET`.

## Things the admin cannot do

- Add, remove, or reorder stories. Structure (id, order, testament)
  is code-controlled.
- Upload images. `templateSrc` accepts a URL or path; uploading
  arbitrary files would need Vercel Blob and stricter security.
- Manage multiple admins. v1 is single shared password.
