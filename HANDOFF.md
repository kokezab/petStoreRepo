# Handoff: CI/CD E2E Against Deployed App

## What was implemented

After a push to `main`, a new GitHub Actions workflow waits for Vercel to finish deploying that exact commit, then runs the Playwright e2e suite against the real deployed URL (instead of a local dev server).

- `.github/workflows/e2e-deployed.yml` (repo root — not under `frontend/`, since GitHub only reads workflows from the true repo root): job 1 polls GitHub's Deployments API for the pushed commit's Vercel deployment until it reports `success`; job 2 runs `npm run test:e2e` with `E2E_BASE_URL` set to that deployment's URL, uploading the Playwright report as an artifact on failure.
- `frontend/scripts/wait-for-vercel-deployment.mjs` — the polling logic (+ CLI entry point), fully unit-tested (`frontend/scripts/wait-for-vercel-deployment.test.mjs`, 6 tests). No Vercel token needed — uses the default `GITHUB_TOKEN` since Vercel's GitHub App already posts deployment statuses.
- `frontend/playwright.config.ts` — now honors `E2E_BASE_URL` when set (skips the local `webServer` bootstrap); local/default behavior unchanged.
- `frontend/vitest.config.ts` — include glob widened to pick up tests under `scripts/`.

Verified live: Vercel's GitHub integration is confirmed connected to `kokezab/petStoreRepo` (real `Production`/`Preview` deployments with `success` status and valid `target_url` exist).

## State

- Branch `feature/e2e-against-deployed-app` pushed, PR open: https://github.com/kokezab/petStoreRepo/pull/7
- Went through full design → plan → subagent-driven implementation → final review cycle. Final review found 2 Important findings (missing API response validation, unguarded `undefined target_url`), both fixed and re-reviewed clean.
- Design doc: `frontend/docs/superpowers/specs/2026-07-16-e2e-against-deployed-app-design.md`
- Plan: `frontend/docs/superpowers/plans/2026-07-16-e2e-against-deployed-app.md`

## Not yet done

- PR #7 not yet merged.
- No live confirmation that the workflow itself runs correctly end-to-end on GitHub Actions (only unit-tested + manually verified the Deployments API data exists) — first real run happens after merging to `main`.
- 3 Minor findings from final review were accepted as-is, not fixed: Vercel Deployment Protection/SSO could block the e2e job if ever enabled (undocumented), a harmless extra ~30s sleep before the timeout throw, and a couple of untested branches (`production`-environment preference, `error` state) in the polling script.

## Suggested skills for next session

- `superpowers:finishing-a-development-branch` — once PR #7 is merged, to clean up the branch.
- `superpowers:systematic-debugging` — if the first real Actions run fails, to diagnose rather than guess.
