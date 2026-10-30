import { anthropic } from '@ai-sdk/anthropic';
import { web } from '@e2e-dev/web';
import type { E2EConfig } from 'e2e';

export default {
  targets: [
    {
      engine: web(),
      app: {
        url: process.env.APP_URL ?? 'http://localhost:5173',
        // Or let the runner start the dev server:
        // command: { executable: 'npm', args: ['run', 'dev'] },
      },
    },
  ],
  agents: {
    default: {
      model: anthropic('claude-haiku-5-5'),
      system: 'You are a QA testing agent.',
    },
  },
} satisfies E2EConfig;
