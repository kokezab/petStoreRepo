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

See `frontend/README.md` for frontend app setup.
