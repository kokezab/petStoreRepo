# Unleash feature-flag engine via Docker — design spec

## Purpose

Stand up a self-hosted, mainstream feature-flag engine as local infra for this repo, using Docker.
This is general-purpose infrastructure: no application code is wired to it yet. The goal is a
working, documented local environment that the frontend (or other services) can integrate with
later, when specific flags are needed.

## Chosen solution

[Unleash](https://www.getunleash.io/) — the most widely adopted open-source feature-flag engine.
Reasons:

- Official Docker image (`unleashorg/unleash-server:8`) and Postgres backing store, both well documented.
- Free self-hosted tier has no artificial limits on flags/environments.
- First-party SDKs (including JS/React) available for future app integration.
- Low operational footprint: two containers (Unleash + Postgres), no extra services required.

## Scope

- Docker Compose setup only: Unleash server + Postgres, running locally.
- Dev-friendly secrets handling (`.env.example` + gitignored `.env`).
- Minimal usage documentation (how to start it, where the UI is, how to get a token).

Out of scope for this pass:

- Wiring any Unleash SDK into the React app.
- Defining actual feature flags.
- Production hardening: TLS, managed secrets, HA/replicated Postgres, backups.

## Layout

```
it-frontend-repo/
├── docker-compose.yml       # new — Unleash + Postgres
├── .env.example             # new — placeholder dev values
├── .gitignore                # updated — ignore .env
└── frontend/                 # existing app, untouched
```

The compose file lives at the repo root, not inside `frontend/`, because it is platform infra that
sits alongside the app rather than being part of it.

## Services

### `postgres`

- Image: `postgres:16-alpine`.
- Env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (all from `.env`).
- Named volume `unleash_db_data` mounted at `/var/lib/postgresql/data` for persistence across
  `docker compose down` / restarts.
- Not published to the host — only reachable from the `unleash` service over the compose network.
- Healthcheck (`pg_isready`) so `unleash` doesn't start against a database that isn't ready yet.

### `unleash`

- Image: `unleashorg/unleash-server:8`.
- Env:
  - `DATABASE_URL` (built from the same Postgres credentials, pointing at the `postgres` service).
  - `DATABASE_SSL=false` (local dev, no TLS).
  - `INIT_ADMIN_API_TOKENS` set from `.env` — provisions a dev API token on first boot so the API
    is usable immediately without a manual UI step.
- Published on `4242:4242` (Unleash's default UI/API port).
- `depends_on: postgres` with `condition: service_healthy`.

Both services share a dedicated compose network (e.g. `unleash_net`); Postgres has no host port
mapping.

## Secrets / configuration

- `.env.example` is committed with placeholder dev-only values for `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `UNLEASH_ADMIN_TOKEN`.
- `.env` (the real file, copied from the example) is added to `.gitignore` and never committed.
- `docker-compose.yml` reads values via `env_file: .env` / `${VAR}` interpolation — no secrets
  hardcoded in the compose file itself.

## Usage documentation

A short "Feature flags (Unleash)" section is added to a root `README.md` (created if it doesn't
exist yet, since the repo currently only has `frontend/README.md`, which is the stock Vite
template). It covers:

1. `cp .env.example .env` (first-time setup).
2. `docker compose up -d`.
3. Unleash UI at `http://localhost:4242` (default login `admin` / `unleash4all` on first boot,
   unless overridden via env).
4. Where the dev API token comes from (`INIT_ADMIN_API_TOKENS` in `.env`) for future SDK use.
5. `docker compose down` (add `-v` to also wipe persisted data).

## Testing / verification

No automated tests apply to this infra-only change. Verification is manual:

- `docker compose up -d` succeeds, both containers reach a healthy/running state.
- Unleash UI is reachable at `http://localhost:4242` and login succeeds.
- Restarting the stack (`docker compose down && docker compose up -d`) preserves previously
  created flags/config (volume persistence check).
