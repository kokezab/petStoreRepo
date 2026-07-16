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
