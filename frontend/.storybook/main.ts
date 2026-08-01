import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The `@` -> src alias is inherited from vite.config.ts automatically,
  // because @storybook/react-vite loads the project's Vite config.
};

export default config;
