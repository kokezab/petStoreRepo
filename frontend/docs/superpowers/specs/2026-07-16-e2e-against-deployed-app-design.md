# E2E Tests Against Deployed Vercel App — Design

## Goal

After every push to `main` (which triggers a Vercel deploy), automatically run the existing Playwright e2e suite (`npm run test:e2e`) against the actual deployed app instead of a local dev server, and surface pass/fail clearly.

## Trigger

GitHub Actions workflow `.github/workflows/e2e-deployed.yml`, triggered on `push` to `main`.

## Finding the deployment URL

Vercel's GitHub App creates a GitHub Deployment + Deployment Status for each commit automatically — no Vercel token or secret is required to read this.

1. Poll `GET /repos/{owner}/{repo}/deployments?sha={sha}` until a deployment exists for the pushed commit.
2. Poll `GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses` until the latest status has `state == success`.
3. Read `target_url` from that status — this is the unique URL for this exact deployment.
4. Timeout after ~5 minutes (10 retries, 30s apart) and fail the workflow if the deployment never reports success, since there's nothing to test against.

## Running the tests

- Job depends on the polling step succeeding and receives the resolved URL as an output.
- Steps: checkout → `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:e2e`.
- `E2E_BASE_URL` env var is set to the resolved deployment URL for the test run.

## Playwright config change

`playwright.config.ts` currently always starts a local dev server (`webServer` block) and hardcodes `baseURL: 'http://localhost:5200'`. Change:

- If `process.env.E2E_BASE_URL` is set, use it as `baseURL` and omit the `webServer` block entirely (we're hitting a real deployed instance, not a local server).
- Otherwise, keep current local-dev behavior unchanged.

## Notification

No new integration. The workflow is named clearly ("E2E against deployed app") so GitHub's native failure notifications (email, if enabled in repo/user notification settings) are self-explanatory. The Playwright HTML report is uploaded as a workflow artifact on failure for debugging. Slack/email-step notification can be added later as a follow-up if native notifications prove insufficient.

## Out of scope

- Vercel preview deployments (PRs) — this only covers the `main` production deploy.
- Non-GitHub-native notifications (Slack, custom email) — deferred.
