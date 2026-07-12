# it-frontend-repo

## Feature flags (Unleash)

This repo runs [Unleash](https://www.getunleash.io/), an open-source feature-flag engine, locally via Docker Compose for development. It's currently infra-only — no application code consumes it yet.

### Start it

```bash
cp .env.example .env   # first time only
docker compose up -d
```

### Use it

- Admin UI: http://localhost:4242
- Default first-boot login: `admin` / `unleash4all` (unless overridden — see [Unleash docs](https://docs.getunleash.io/)).
- A dev API token is provisioned automatically from `UNLEASH_ADMIN_TOKEN` in `.env`, for future SDK integration.

### Stop it

```bash
docker compose down       # stops containers, keeps data
docker compose down -v    # stops containers and wipes stored flags/config
```

See `frontend/README.md` for frontend app setup.
