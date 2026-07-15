# CI/CD Deploy to Contabo VPS — Design

**Date:** 2026-07-15
**Status:** Approved

## Goal

Push to `main` on GitHub → app is automatically rebuilt and live on the Contabo VPS, no manual steps.

## Context

- Repo: `kokezab/petStoreRepo` (public, GitHub).
- App: Vite + React SPA, built with `npm run build` into `dist/`.
- VPS already has Docker and a host-level nginx (RPM-style layout: `/etc/nginx/nginx.conf` + `/etc/nginx/conf.d/*.conf`) reverse-proxying other sites.
- No Dockerfile, compose file, or GitHub Actions workflow exist in the repo yet.
- Build-time env vars (`VITE_UNLEASH_URL`, `VITE_UNLEASH_CLIENT_KEY`) are baked into the bundle by Vite at build time; production values aren't decided yet — placeholders are fine for now.
- Domain name is not decided yet — nginx server_name will be a placeholder the user swaps in later.

## Architecture

```
push to main
   │
   ▼
GitHub Actions (.github/workflows/deploy.yml)
  1. build Vite app + Docker image (nginx:alpine serving dist/)
  2. push image → ghcr.io/kokezab/petstorerepo:latest and :<sha>
  3. SSH into VPS (appleboy/ssh-action, key-based auth)
  4. docker compose pull && docker compose up -d
       container listens on 127.0.0.1:8081 only
   │
   ▼
Host nginx (/etc/nginx/conf.d/petstore.conf, added once, manually)
  proxy_pass http://127.0.0.1:8081  →  public domain
```

## Components added to the repo

- `Dockerfile` — multi-stage build: `node` stage runs `npm ci && npm run build`; final stage is `nginx:alpine` serving `/dist` with SPA fallback routing.
- `docker/nginx.conf` — container-internal nginx config: `try_files $uri /index.html;`, gzip on, cache headers for static assets.
- `docker-compose.yml` — deployed to the VPS by the workflow; defines the `petstore` service (image ref, `restart: unless-stopped`, port mapping `127.0.0.1:8081:80`).
- `.github/workflows/deploy.yml` — on push to `main`: build, push image to GHCR, scp `docker-compose.yml` to VPS, SSH in and run `docker compose pull && docker compose up -d`.

## GitHub Secrets required

- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` — SSH access to the VPS deploy user.
- `VITE_UNLEASH_URL`, `VITE_UNLEASH_CLIENT_KEY` — optional repo variables/secrets passed as Docker build args; empty/placeholder until real values exist.

`GITHUB_TOKEN` (automatic) is used to push to GHCR; no extra secret needed for that step.

## One-time manual VPS setup (not automated)

1. Generate an SSH keypair for deploys; add the public key to the VPS deploy user's `~/.ssh/authorized_keys`; store the private key as `VPS_SSH_KEY`.
2. After the first successful push, make the GHCR package public (GitHub package settings) so the VPS can `docker pull` without credentials.
3. Add `/etc/nginx/conf.d/petstore.conf` on the host with a placeholder `server_name petstore.example.com;` and `proxy_pass http://127.0.0.1:8081;`, then `nginx -s reload`. Swap in the real domain once DNS is pointed. HTTPS/certbot is a follow-up once DNS is live.
4. Ensure `docker` and `docker compose` (v2 plugin) are available to the deploy user, and that user can run docker without `sudo` (in the `docker` group) or the workflow uses `sudo` non-interactively.

## Rollback

Images are tagged with both `latest` and the git SHA. If `latest` breaks, rollback is manually editing `docker-compose.yml` on the VPS to pin the previous SHA tag and re-running `docker compose up -d`. Not automated — kept simple (YAGNI); can revisit if this becomes a recurring need.

## Out of scope (for now)

- HTTPS/certbot automation (needs a real domain/DNS first).
- Blue-green or zero-downtime deploys.
- Automated rollback.
- Multi-environment (staging) pipeline.
