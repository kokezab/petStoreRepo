# it-frontend-repo

## Feature flags (Unleash)

This repo runs [Unleash](https://www.getunleash.io/), an open-source feature-flag engine, locally via Docker Compose for development. The frontend app (`frontend/`) reads flags from it via Unleash's built-in Frontend API.

### Start it

```bash
cp .env.example .env   # first time only
docker compose up -d
```

### Use it

- Admin UI: http://localhost:4242
- Default first-boot login: `admin` / `unleash4all` (unless overridden — see [Unleash docs](https://docs.getunleash.io/)).
- A dev API token is provisioned automatically from `UNLEASH_ADMIN_TOKEN` in `.env`, for future SDK integration.

### Frontend integration

The app reads flags through Unleash's Frontend API, which needs its own token type (separate from the admin token above):

1. In the Unleash UI (`http://localhost:4242`), create a flag named `pet-creation`.
2. Go to **Admin → API access** and create a token of type **FRONTEND**.
3. `cp frontend/.env.example frontend/.env.local` and set `VITE_UNLEASH_CLIENT_KEY` to that token.
4. `npm run dev` (inside `frontend/`) picks up `.env.local` automatically.

Without this setup the app still runs fine — flags just evaluate to `false`.

### Stop it

```bash
docker compose down       # stops containers, keeps data
docker compose down -v    # stops containers and wipes stored flags/config
```

### Deployed environments (Vercel)

Preview deployments (staging) and the production deployment each build against a
hosted Unleash instance (getunleash.io), not the local Docker one. Vite bakes
`VITE_*` variables in at build time, so these must be set as **Vercel project
environment variables**, scoped per Vercel environment — not committed to this repo:

| Vercel scope | Unleash environment | Variables to set |
| --- | --- | --- |
| Preview | `development` (staging) | `VITE_UNLEASH_URL`, `VITE_UNLEASH_CLIENT_KEY`, `VITE_UNLEASH_APP_NAME` |
| Production | `production` | `VITE_UNLEASH_URL`, `VITE_UNLEASH_CLIENT_KEY`, `VITE_UNLEASH_APP_NAME` |

Steps:

1. In getunleash.io, under **Admin → API access**, create (or reuse) a **Frontend API
   token** scoped to the `development` environment, and one scoped to `production`.
   Toggle each flag on/off per Unleash environment there — that's what makes a flag
   off in staging and on in production (or vice versa).
2. In Vercel → Project Settings → Environment Variables, add the three `VITE_UNLEASH_*`
   variables under the **Preview** scope using the `development` token, and again
   under the **Production** scope using the `production` token. Set
   `VITE_UNLEASH_URL` to your hosted instance's Frontend API URL, e.g.
   `https://<your-instance>.getunleash.io/api/frontend`.
3. Redeploy. Existing deployments keep whatever was baked in at their last build, so
   env var changes only take effect on the next build/deploy.

Never paste real Unleash tokens into this repo, PRs, or chat — treat the Vercel
dashboard as the only place they're entered, and rotate a token immediately if it's
ever exposed elsewhere.

See `frontend/README.md` for frontend app setup.
