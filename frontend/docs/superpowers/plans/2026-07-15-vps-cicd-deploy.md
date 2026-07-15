# VPS CI/CD Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push to `main` on GitHub automatically rebuilds the Vite app as a Docker image and redeploys it live on the Contabo VPS behind the existing host nginx.

**Architecture:** Multi-stage Dockerfile builds the app and serves it via an internal `nginx:alpine`, published to GHCR. A GitHub Actions workflow builds/pushes the image on push to `main`, then SSHes into the VPS to run `docker compose pull && docker compose up -d`. The container binds to `127.0.0.1:8081` only; the VPS's existing host nginx reverse-proxies the public domain to that port (configured once, manually).

**Tech Stack:** Docker, Docker Compose v2, GitHub Actions, GHCR (ghcr.io), nginx (container + host), appleboy/ssh-action, appleboy/scp-action.

## Global Constraints

- GHCR image name must be lowercase: `ghcr.io/kokezab/petstorerepo` (spec: repo is `petStoreRepo`, GHCR requires lowercase).
- Repo is public — GHCR package will be made public after first push, so the VPS pulls without credentials (spec).
- Container must bind only to `127.0.0.1:8081` on the host, never a public interface — the host nginx is the sole public-facing entry point (spec).
- `VITE_UNLEASH_URL` / `VITE_UNLEASH_CLIENT_KEY` are Vite build-time env vars — passed as Docker build args, empty/placeholder until real values exist (spec).
- No HTTPS/certbot, blue-green deploy, or automated rollback in this plan — explicitly out of scope (spec).

---

### Task 1: Dockerfile and container-internal nginx config

**Files:**
- Create: `Dockerfile`
- Create: `docker/nginx.conf`
- Create: `.dockerignore`

**Interfaces:**
- Produces: a Docker image, when built, that serves the built SPA on port 80 with `try_files` SPA fallback routing. Later tasks (docker-compose.yml, GitHub Actions workflow) reference this Dockerfile by building from repo root (`context: .`) and expect the image to expose port 80.

- [ ] **Step 1: Write `.dockerignore`**

```
node_modules
dist
.git
.github
docs
test-results
tests
*.md
.env
.env.local
```

- [ ] **Step 2: Write `docker/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 3: Write `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_UNLEASH_URL=""
ARG VITE_UNLEASH_CLIENT_KEY=""
ENV VITE_UNLEASH_URL=$VITE_UNLEASH_URL
ENV VITE_UNLEASH_CLIENT_KEY=$VITE_UNLEASH_CLIENT_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 4: Build the image locally**

Run: `docker build -t petstore:local .`
Expected: build completes with `Successfully tagged petstore:local` (or Buildx equivalent final `naming to docker.io/library/petstore:local` line), no errors.

- [ ] **Step 5: Run the container and verify it serves the app**

Run:
```bash
docker run --rm -d -p 8081:80 --name petstore-test petstore:local
sleep 2
curl -sf http://localhost:8081/ | grep -o '<div id="root">'
docker stop petstore-test
```
Expected: `curl` succeeds (exit 0) and prints `<div id="root">` (confirms `index.html` is served); container stops cleanly afterward.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker/nginx.conf .dockerignore
git commit -m "build: add Dockerfile and container nginx config for VPS deploy"
```

---

### Task 2: docker-compose.yml for the VPS

**Files:**
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: the image built in Task 1, referenced by tag `ghcr.io/kokezab/petstorerepo:latest`.
- Produces: a compose file that Task 4's GitHub Actions deploy job copies to the VPS and runs via `docker compose pull && docker compose up -d`.

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  petstore:
    image: ghcr.io/kokezab/petstorerepo:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:80"
```

- [ ] **Step 2: Validate compose file and run it locally against the image built in Task 1**

Run:
```bash
docker tag petstore:local ghcr.io/kokezab/petstorerepo:latest
docker compose config --quiet
docker compose up -d
sleep 2
curl -sf http://localhost:8081/ | grep -o '<div id="root">'
docker compose down
docker rmi ghcr.io/kokezab/petstorerepo:latest
```
Expected: `docker compose config --quiet` prints nothing and exits 0 (valid YAML); `curl` prints `<div id="root">`; `docker compose down` stops and removes the container cleanly.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "build: add docker-compose.yml for VPS deployment"
```

---

### Task 3: GitHub Actions workflow — build and push image to GHCR

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `Dockerfile` from Task 1 (build context `.`), build args `VITE_UNLEASH_URL` (repo variable) and `VITE_UNLEASH_CLIENT_KEY` (repo secret).
- Produces: a `build-and-push` job publishing `ghcr.io/kokezab/petstorerepo:latest` and `:${{ github.sha }}`. Task 4 adds a `deploy` job with `needs: build-and-push` to this same file.

- [ ] **Step 1: Write `.github/workflows/deploy.yml` with the build-and-push job**

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

env:
  IMAGE_NAME: ghcr.io/kokezab/petstorerepo

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
          build-args: |
            VITE_UNLEASH_URL=${{ vars.VITE_UNLEASH_URL }}
            VITE_UNLEASH_CLIENT_KEY=${{ secrets.VITE_UNLEASH_CLIENT_KEY }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: Validate the YAML parses correctly**

Run: `npx -y js-yaml .github/workflows/deploy.yml`
Expected: prints the parsed YAML structure back out (as JSON-ish/YAML dump) with no parse errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow to build and push image to GHCR"
```

---

### Task 4: Extend workflow with SSH deploy to VPS

**Files:**
- Modify: `.github/workflows/deploy.yml` (append a `deploy` job)

**Interfaces:**
- Consumes: `docker-compose.yml` from Task 2 (copied to VPS via scp); the `build-and-push` job from Task 3 (via `needs:`); GitHub secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
- Produces: on the VPS, `~/petstore/docker-compose.yml` is kept in sync with the repo, and `docker compose pull && docker compose up -d` is run there after every successful build.

- [ ] **Step 1: Append the `deploy` job to `.github/workflows/deploy.yml`**

Add this job under the existing `jobs:` key (same indentation level as `build-and-push`):

```yaml
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copy docker-compose.yml to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "docker-compose.yml"
          target: "~/petstore"

      - name: Deploy on VPS
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/petstore
            docker compose pull
            docker compose up -d
```

- [ ] **Step 2: Validate the YAML parses correctly**

Run: `npx -y js-yaml .github/workflows/deploy.yml`
Expected: prints the parsed structure with both `build-and-push` and `deploy` jobs present, no parse errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add SSH deploy step to push new image live on the VPS"
```

---

### Task 5: One-time VPS setup docs and host nginx template

**Files:**
- Create: `docs/deploy/vps-setup.md`
- Create: `docs/deploy/nginx-petstore.conf.example`

**Interfaces:**
- Consumes: nothing from prior tasks (documentation only), but references the port (`127.0.0.1:8081`), image name (`ghcr.io/kokezab/petstorerepo`), and secret names (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VITE_UNLEASH_URL`, `VITE_UNLEASH_CLIENT_KEY`) established in Tasks 1-4.
- Produces: nothing consumed by later automation — this is the human runbook for the one-time manual steps called out in the design spec.

- [ ] **Step 1: Write `docs/deploy/nginx-petstore.conf.example`**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name petstore.example.com;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 2: Write `docs/deploy/vps-setup.md`**

```markdown
# One-time VPS setup for CI/CD deploy

These steps are manual and only need to be done once per VPS. After this,
every push to `main` deploys automatically via `.github/workflows/deploy.yml`.

## 1. SSH deploy key

On your local machine:

    ssh-keygen -t ed25519 -f petstore_deploy_key -C "github-actions-deploy"

Append `petstore_deploy_key.pub` to the deploy user's `~/.ssh/authorized_keys`
on the VPS. Add these repo secrets on GitHub (Settings > Secrets and variables
> Actions):

- `VPS_HOST` — the VPS IP or hostname
- `VPS_USER` — the deploy user (must be in the `docker` group so it can run
  `docker`/`docker compose` without `sudo`)
- `VPS_SSH_KEY` — contents of the private key `petstore_deploy_key`

## 2. Prepare the deploy directory on the VPS

    mkdir -p ~/petstore

The first workflow run will scp `docker-compose.yml` into this directory.

## 3. Make the GHCR package public

After the first successful push to `main`, go to the `petstorerepo` package
under your GitHub profile's Packages tab, open Package settings, and change
visibility to Public. This lets the VPS `docker pull` without any registry
credentials.

## 4. Add the host nginx reverse proxy

Copy `docs/deploy/nginx-petstore.conf.example` to
`/etc/nginx/conf.d/petstore.conf` on the VPS, replacing `server_name
petstore.example.com;` with your real domain once DNS is pointed at the VPS.
Then reload nginx:

    nginx -t && nginx -s reload

HTTPS (certbot) is a follow-up once the domain is live — not covered here.

## 5. (Optional) build-time env vars

If you have real Unleash values, add them as a repo variable
`VITE_UNLEASH_URL` and repo secret `VITE_UNLEASH_CLIENT_KEY` in GitHub
Settings — the workflow already passes them as Docker build args.
```

- [ ] **Step 3: Commit**

```bash
git add docs/deploy/vps-setup.md docs/deploy/nginx-petstore.conf.example
git commit -m "docs: add one-time VPS setup runbook for CI/CD deploy"
```
