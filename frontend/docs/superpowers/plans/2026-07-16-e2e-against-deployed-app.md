# E2E Against Deployed App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After every push to `main`, automatically run the existing Playwright e2e suite against the real Vercel deployment for that commit, and fail the GitHub Actions run (with an uploaded report) if anything breaks.

**Architecture:** A small standalone Node script polls the GitHub Deployments API (populated automatically by Vercel's GitHub App — no Vercel token needed) until the deployment for the pushed commit reports `success`, then emits its `target_url`. A GitHub Actions workflow runs that script as one job, then feeds the resulting URL into a second job that runs `npm run test:e2e` with `E2E_BASE_URL` set. `playwright.config.ts` is taught to use `E2E_BASE_URL` as `baseURL` and skip its local dev-server bootstrap when that variable is present.

**Tech Stack:** Node.js (built-in `fetch`), Vitest (existing test runner), GitHub Actions, Playwright.

## Global Constraints

- No Vercel API token or secret required — use the GitHub Deployments API populated by Vercel's GitHub App integration.
- Do not change local dev/test behavior: `npm run test:e2e` without `E2E_BASE_URL` must keep starting the local Vite dev server exactly as today.
- Poll timeout: 10 attempts, 30s apart (~5 minutes total), per the approved design doc (`docs/superpowers/specs/2026-07-16-e2e-against-deployed-app-design.md`).
- Notification relies on GitHub Actions' native failure signaling (red X, optional email) — no Slack/email integration in this plan.

---

### Task 1: Let Vitest see scripts under `scripts/`

**Files:**
- Modify: `vitest.config.ts:16`

**Interfaces:**
- Produces: Vitest will now discover `*.test.mjs`/`*.test.ts` files under `scripts/`, in addition to the existing `src/**` pattern.

- [ ] **Step 1: Update the `include` glob**

In `vitest.config.ts`, change:

```ts
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
```

to:

```ts
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'scripts/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
```

- [ ] **Step 2: Verify Vitest still runs cleanly with no test files under `scripts/` yet**

Run: `npx vitest run`
Expected: same pass/fail counts as before this change (no new tests picked up yet, no errors about the new glob).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "Let Vitest discover tests under scripts/"
```

---

### Task 2: `wait-for-vercel-deployment` script (TDD)

**Files:**
- Create: `scripts/wait-for-vercel-deployment.mjs`
- Test: `scripts/wait-for-vercel-deployment.test.mjs`

**Interfaces:**
- Produces: `export async function waitForDeploymentUrl({ owner, repo, sha, githubToken, fetchImpl, sleepImpl, maxAttempts, delayMs })` — resolves to a `string` (the deployment's `target_url`) or throws an `Error`.
  - `fetchImpl` defaults to the global `fetch` (Node 18+ built-in).
  - `sleepImpl` defaults to a real `setTimeout`-based delay; tests inject a no-op so retries don't actually wait.
  - `maxAttempts` defaults to `10`, `delayMs` defaults to `30000` (matches the design doc's ~5 minute budget).
- Consumes: nothing from other tasks.

**Behavior:**
1. Call `GET https://api.github.com/repos/{owner}/{repo}/deployments?sha={sha}&per_page=100` with headers `Authorization: Bearer {githubToken}` and `Accept: application/vnd.github+json`.
2. If the response array is empty, wait `delayMs` and retry (counts as one attempt).
3. Otherwise, pick the most relevant deployment: prefer one with `environment === 'production'` (case-insensitive), else the most recently created one (`created_at` descending).
4. Call `GET https://api.github.com/repos/{owner}/{repo}/deployments/{deployment.id}/statuses` with the same headers. GitHub returns statuses newest-first, so take `statuses[0]`.
5. If there are no statuses yet, wait `delayMs` and retry.
6. If the latest status's `state` is `'success'`, return its `target_url`.
7. If the latest status's `state` is `'failure'` or `'error'`, throw `new Error(\`Vercel deployment reported state "${state}"\`)` immediately (don't keep retrying a dead deployment).
8. If the latest status's `state` is anything else (e.g. `'pending'`, `'in_progress'`, `'queued'`), wait `delayMs` and retry.
9. After `maxAttempts` attempts with no success/failure resolution, throw `new Error('Timed out waiting for a successful Vercel deployment status')`.

Also add a CLI entry point so the workflow can invoke this file directly:
- Reads `owner`/`repo` by splitting `process.env.GITHUB_REPOSITORY` on `/`.
- Reads `sha` from `process.env.GITHUB_SHA`.
- Reads `githubToken` from `process.env.GITHUB_TOKEN`.
- On success, prints the URL to stdout and, if `process.env.GITHUB_OUTPUT` is set, appends `url=<value>\n` to that file (GitHub Actions' step-output mechanism).
- On failure, prints the error message to stderr and exits with code `1`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/wait-for-vercel-deployment.test.mjs`:

```js
import { describe, expect, it, vi } from 'vitest';
import { waitForDeploymentUrl } from './wait-for-vercel-deployment.mjs';

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

const noopSleep = async () => {};

describe('waitForDeploymentUrl', () => {
  it('returns target_url when the first deployment status is success', async () => {
    const fetchImpl = vi
      .fn()
      // deployments list
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 1, environment: 'production', created_at: '2026-07-16T00:00:00Z' },
        ]),
      )
      // statuses list
      .mockResolvedValueOnce(
        jsonResponse([{ state: 'success', target_url: 'https://my-app.vercel.app' }]),
      );

    const url = await waitForDeploymentUrl({
      owner: 'kokezab',
      repo: 'petStoreRepo',
      sha: 'abc123',
      githubToken: 'token',
      fetchImpl,
      sleepImpl: noopSleep,
    });

    expect(url).toBe('https://my-app.vercel.app');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries when the deployments list is empty, then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([])) // attempt 1: no deployment yet
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 2, environment: 'production', created_at: '2026-07-16T00:00:00Z' },
        ]),
      ) // attempt 2: deployment found
      .mockResolvedValueOnce(
        jsonResponse([{ state: 'success', target_url: 'https://my-app.vercel.app' }]),
      );

    const url = await waitForDeploymentUrl({
      owner: 'kokezab',
      repo: 'petStoreRepo',
      sha: 'abc123',
      githubToken: 'token',
      fetchImpl,
      sleepImpl: noopSleep,
      maxAttempts: 5,
    });

    expect(url).toBe('https://my-app.vercel.app');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('throws immediately when the deployment status is failure', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 3, environment: 'production', created_at: '2026-07-16T00:00:00Z' },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ state: 'failure' }]));

    await expect(
      waitForDeploymentUrl({
        owner: 'kokezab',
        repo: 'petStoreRepo',
        sha: 'abc123',
        githubToken: 'token',
        fetchImpl,
        sleepImpl: noopSleep,
        maxAttempts: 5,
      }),
    ).rejects.toThrow('Vercel deployment reported state "failure"');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws a timeout error after exhausting maxAttempts', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]));

    await expect(
      waitForDeploymentUrl({
        owner: 'kokezab',
        repo: 'petStoreRepo',
        sha: 'abc123',
        githubToken: 'token',
        fetchImpl,
        sleepImpl: noopSleep,
        maxAttempts: 3,
      }),
    ).rejects.toThrow('Timed out waiting for a successful Vercel deployment status');

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/wait-for-vercel-deployment.test.mjs`
Expected: FAIL — `Cannot find module './wait-for-vercel-deployment.mjs'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `scripts/wait-for-vercel-deployment.mjs`:

```js
const GITHUB_API = 'https://api.github.com';

function githubHeaders(githubToken) {
  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
  };
}

function realSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickDeployment(deployments) {
  const production = deployments.find(
    (d) => (d.environment ?? '').toLowerCase() === 'production',
  );
  if (production) return production;

  return [...deployments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}

export async function waitForDeploymentUrl({
  owner,
  repo,
  sha,
  githubToken,
  fetchImpl = fetch,
  sleepImpl = realSleep,
  maxAttempts = 10,
  delayMs = 30000,
}) {
  const headers = githubHeaders(githubToken);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const deploymentsRes = await fetchImpl(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments?sha=${sha}&per_page=100`,
      { headers },
    );
    const deployments = await deploymentsRes.json();

    if (deployments.length === 0) {
      await sleepImpl(delayMs);
      continue;
    }

    const deployment = pickDeployment(deployments);

    const statusesRes = await fetchImpl(
      `${GITHUB_API}/repos/${owner}/${repo}/deployments/${deployment.id}/statuses`,
      { headers },
    );
    const statuses = await statusesRes.json();

    if (statuses.length === 0) {
      await sleepImpl(delayMs);
      continue;
    }

    const latestStatus = statuses[0];

    if (latestStatus.state === 'success') {
      return latestStatus.target_url;
    }

    if (latestStatus.state === 'failure' || latestStatus.state === 'error') {
      throw new Error(`Vercel deployment reported state "${latestStatus.state}"`);
    }

    await sleepImpl(delayMs);
  }

  throw new Error('Timed out waiting for a successful Vercel deployment status');
}

async function main() {
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  const sha = process.env.GITHUB_SHA;
  const githubToken = process.env.GITHUB_TOKEN;

  try {
    const url = await waitForDeploymentUrl({ owner, repo, sha, githubToken });
    console.log(url);

    if (process.env.GITHUB_OUTPUT) {
      const fs = await import('node:fs/promises');
      await fs.appendFile(process.env.GITHUB_OUTPUT, `url=${url}\n`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/wait-for-vercel-deployment.test.mjs`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add scripts/wait-for-vercel-deployment.mjs scripts/wait-for-vercel-deployment.test.mjs
git commit -m "Add script to poll GitHub Deployments API for Vercel deployment URL"
```

---

### Task 3: Teach `playwright.config.ts` about `E2E_BASE_URL`

**Files:**
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: `process.env.E2E_BASE_URL` (set by the workflow in Task 4; unset in local/default runs).
- Produces: no change to exported shape — still the default Playwright config object.

- [ ] **Step 1: Update the config**

Replace the current file contents with:

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/acceptance/features/**/*.feature',
  steps: 'tests/acceptance/steps/**/*.ts',
  outputDir: 'tests/acceptance/.features-gen',
});

const deployedBaseURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir,
  ...(deployedBaseURL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:5200',
          reuseExistingServer: !process.env.CI,
        },
      }),
  use: {
    baseURL: deployedBaseURL ?? 'http://localhost:5200',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 2: Verify local behavior is unchanged**

Run: `npx playwright test --list`
Expected: lists the existing test scenarios without errors (this still boots via the local `webServer` path since `E2E_BASE_URL` is unset).

- [ ] **Step 3: Verify the deployed-URL path doesn't try to start a local server**

Run (macOS/Linux shell syntax — on Windows PowerShell use `$env:E2E_BASE_URL='https://example.com'; npx playwright test --list; Remove-Item Env:\E2E_BASE_URL`):

```bash
E2E_BASE_URL=https://example.com npx playwright test --list
```

Expected: lists the same scenarios, with no attempt to run `npm run dev` (no dev-server startup log lines).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts
git commit -m "Support running Playwright against a deployed URL via E2E_BASE_URL"
```

---

### Task 4: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/e2e-deployed.yml`

**Interfaces:**
- Consumes: `waitForDeploymentUrl`'s CLI entry point from Task 2 (`node scripts/wait-for-vercel-deployment.mjs`, reading `GITHUB_REPOSITORY`/`GITHUB_SHA`/`GITHUB_TOKEN` env vars, writing `url=<value>` to `$GITHUB_OUTPUT`).
- Consumes: `E2E_BASE_URL` support in `playwright.config.ts` from Task 3.
- Consumes: `npm run test:e2e` script from `package.json` (unchanged).

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/e2e-deployed.yml`:

```yaml
name: E2E against deployed app

on:
  push:
    branches: [main]

permissions:
  deployments: read
  contents: read

jobs:
  wait-for-deployment:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.wait.outputs.url }}
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - name: Wait for Vercel deployment to succeed
        id: wait
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/wait-for-vercel-deployment.mjs

  e2e:
    needs: wait-for-deployment
    runs-on: ubuntu-latest
    env:
      E2E_BASE_URL: ${{ needs.wait-for-deployment.outputs.url }}
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run e2e tests against deployed app
        run: npm run test:e2e
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

- [ ] **Step 2: Validate YAML syntax**

Run: `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/e2e-deployed.yml', 'utf8'))"`

If the `yaml` package isn't installed, instead run: `npx -y js-yaml .github/workflows/e2e-deployed.yml > /dev/null && echo OK`
Expected: `OK` printed, no parse errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/e2e-deployed.yml
git commit -m "Add workflow to run e2e tests against the deployed Vercel app on push to main"
```

- [ ] **Step 4: Push and observe the first real run**

```bash
git push
```

Then open the repo's Actions tab and confirm the "E2E against deployed app" workflow appears and runs for this push. Since this depends on Vercel's GitHub integration actually being connected to this repo, if the `wait-for-deployment` job fails with "no deployments found," verify in the repo's Vercel project settings that the GitHub integration is enabled for this repository.
