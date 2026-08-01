import type { Decorator } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';

// A fresh QueryClient per story keeps cache/mutation state from leaking.
export const withProviders: Decorator = (Story) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AntApp>
        <Story />
      </AntApp>
    </QueryClientProvider>
  );
};
