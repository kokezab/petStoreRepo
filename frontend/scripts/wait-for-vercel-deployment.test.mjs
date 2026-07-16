import { describe, expect, it, vi } from 'vitest';
import { waitForDeploymentUrl } from './wait-for-vercel-deployment.mjs';

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

function errorResponse(status, statusText) {
  return { ok: false, status, statusText, json: async () => ({ message: statusText }) };
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

  it('throws a clear error when the deployments request is not ok', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(errorResponse(403, 'Forbidden'));

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
    ).rejects.toThrow('GitHub API request failed: 403 Forbidden');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when a success status has no target_url', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 4, environment: 'production', created_at: '2026-07-16T00:00:00Z' },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ state: 'success', target_url: null }]));

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
    ).rejects.toThrow('Vercel deployment succeeded but reported no target_url');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
