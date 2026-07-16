import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/acceptance/features/**/*.feature',
  steps: 'tests/acceptance/steps/**/*.ts',
  outputDir: 'tests/acceptance/.features-gen',
});

export default defineConfig({
  testDir,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5200',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5200',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
