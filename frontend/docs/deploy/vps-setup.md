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
