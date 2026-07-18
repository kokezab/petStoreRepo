export async function enableMocking() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_API_MOCKING === 'false') return;

  const { worker } = await import('@/mocks/browser');
  // Playwright's acceptance suite blocks service workers (so its own page.route()
  // mocks are the only interceptor) — worker.start() then rejects or hangs. Swallow
  // that so the app still renders; real dev-mode registration resolves normally.
  try {
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass', // requests without a mock handler hit the real API
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (error) {
    console.error(
      'MSW failed to start; requests will hit the real network / Playwright mocks.',
      error,
    );
  }
}
