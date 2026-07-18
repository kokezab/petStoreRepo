import { useEffect } from 'react';

import { App } from 'antd';

import { setMessageApi } from '@/lib/antd-message-bridge';

// QueryClient is created outside the React tree (main.tsx), so its
// queryCache/mutationCache onError callbacks can't call the message hook
// directly. This registers the theme-aware message API from antd's <App>
// context so those callbacks can reach it.
export function AntdMessageBridge() {
  const { message } = App.useApp();

  useEffect(() => {
    setMessageApi(message);
  }, [message]);

  return null;
}
