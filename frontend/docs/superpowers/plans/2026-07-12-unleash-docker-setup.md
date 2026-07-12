# Unleash Feature-Flag Engine via Docker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Unleash (self-hosted, open-source feature-flag engine) plus its Postgres backing store as local Docker infra at the repo root, with dev-safe secrets handling and usage docs. No application code is wired to it in this plan.

**Architecture:** A `docker-compose.yml` at the repo root defines two services — `postgres` (data store) and `unleash` (flag engine + admin UI), on a private compose network. Config comes from a gitignored `.env`, seeded from a committed `.env.example`. A root `README.md` documents how to start it, log in, and find the dev API token.

**Tech Stack:** Docker, Docker Compose v2, `postgres:16-alpine`, `unleashorg/unleash-server` (official image).

## Global Constraints

- Compose file and env files live at the **repo root** (`D:/Projects/enablement/it-frontend-repo`), not inside `frontend/` — this is platform infra, not app code.
- No secrets committed: `.env` must be gitignored; only `.env.example` (placeholder values) is committed.
- Postgres has **no host port mapping** — reachable only from `unleash` over the compose network.
- Unleash UI/API published on host port `4242` (Unleash's default).
- Postgres data persists across `docker compose down` / restarts via a named volume.
- `unleash` must not start until Postgres is healthy (`depends_on: condition: service_healthy`).
- No automated test suite applies (infra-only) — verification is manual via `docker compose` and `curl`/browser checks, spelled out per task.

---

### Task 1: Docker Compose stack (Postgres + Unleash) with dev secrets

**Files:**
- Create: `docker-compose.yml` (repo root)
- Create: `.env.example` (repo root)
- Create: `.gitignore` (repo root)

**Interfaces:**
- Produces: a running `postgres` service reachable at hostname `postgres:5432` from within the compose network, and a running `unleash` service reachable at `http://localhost:4242` from the host. Env var names `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `UNLEASH_ADMIN_TOKEN` are the contract later tasks (e.g. README docs, future SDK wiring) refer to.

- [ ] **Step 1: Create `.env.example` with placeholder dev values**

```
# Copy this file to .env and adjust if needed. .env is gitignored.
POSTGRES_USER=unleash
POSTGRES_PASSWORD=unleash_dev_password
POSTGRES_DB=unleash
UNLEASH_ADMIN_TOKEN=*:*.dev-init-admin-token
```

- [ ] **Step 2: Create root `.gitignore`**

```
.env
```

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - unleash_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - unleash_net

  unleash:
    image: unleashorg/unleash-server
    restart: unless-stopped
    ports:
      - "4242:4242"
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      DATABASE_SSL: "false"
      INIT_ADMIN_API_TOKENS: ${UNLEASH_ADMIN_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - unleash_net

networks:
  unleash_net:

volumes:
  unleash_db_data:
```

- [ ] **Step 4: Copy `.env.example` to `.env`**

Run: `cp .env.example .env` (from repo root)
Expected: `.env` created, no output.

- [ ] **Step 5: Start the stack**

Run: `docker compose up -d` (from repo root)
Expected: output shows `postgres` and `unleash` containers created and started, e.g.:
```
 ✔ Network it-frontend-repo_unleash_net  Created
 ✔ Volume "it-frontend-repo_unleash_db_data"  Created
 ✔ Container it-frontend-repo-postgres-1  Started
 ✔ Container it-frontend-repo-unleash-1   Started
```

- [ ] **Step 6: Verify Postgres becomes healthy**

Run: `docker compose ps`
Expected: `postgres` row shows `healthy` in the `STATUS` column within ~30s (poll with the same command if still `starting`).

- [ ] **Step 7: Verify Unleash is reachable and healthy**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4242/health`
Expected: `200`

- [ ] **Step 8: Verify data persistence across restart**

Run:
```bash
docker compose down
docker compose up -d
docker compose ps
```
Expected: both containers come back up (`postgres` reaches `healthy` again) and `docker volume ls` still lists `it-frontend-repo_unleash_db_data` (same volume, not recreated) — confirming data wasn't wiped. `docker compose down` alone (without `-v`) must never remove the volume.

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "Add Unleash + Postgres Docker Compose stack for local feature flags"
```

Note: `.env` itself must NOT be committed (it's gitignored — verify with `git status` that it does not appear).

---

### Task 2: Root README with usage docs

**Files:**
- Create: `README.md` (repo root)

**Interfaces:**
- Consumes: env var names and default port from Task 1 (`4242`, `.env.example` fields).
- Produces: none (documentation leaf task).

- [ ] **Step 1: Write `README.md`**

```markdown
# it-frontend-repo

## Feature flags (Unleash)

This repo runs [Unleash](https://www.getunleash.io/), an open-source feature-flag engine, locally via Docker Compose for development. It's currently infra-only — no application code consumes it yet.

### Start it

\`\`\`bash
cp .env.example .env   # first time only
docker compose up -d
\`\`\`

### Use it

- Admin UI: http://localhost:4242
- Default first-boot login: `admin` / `unleash4all` (unless overridden — see [Unleash docs](https://docs.getunleash.io/)).
- A dev API token is provisioned automatically from `UNLEASH_ADMIN_TOKEN` in `.env`, for future SDK integration.

### Stop it

\`\`\`bash
docker compose down       # stops containers, keeps data
docker compose down -v    # stops containers and wipes stored flags/config
\`\`\`

See `frontend/README.md` for frontend app setup.
```

- [ ] **Step 2: Verify links and commands render correctly**

Run: open `README.md` in a Markdown preview (or `cat README.md`) and confirm the two fenced code blocks and the link to `frontend/README.md` are intact.
Expected: no broken fencing, `frontend/README.md` path resolves (file exists per earlier exploration).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document local Unleash feature-flag setup in root README"
```

---

## Self-Review Notes

- **Spec coverage:** Postgres service ✅ (Task 1), Unleash service ✅ (Task 1), persistence volume ✅ (Task 1 Step 8 verifies), no host port on Postgres ✅ (compose has none), `.env.example` + gitignored `.env` ✅ (Task 1 Steps 1–2), root-level compose file ✅, usage docs ✅ (Task 2). Out-of-scope items (SDK wiring, actual flags, prod hardening) are correctly excluded from both tasks.
- **Placeholder scan:** no TBD/TODO; all steps have literal file contents and exact commands with expected output.
- **Type/name consistency:** env var names (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `UNLEASH_ADMIN_TOKEN`) match exactly between `.env.example`, `docker-compose.yml`, and the README across both tasks. Port `4242` and volume name `unleash_db_data` are consistent throughout.
