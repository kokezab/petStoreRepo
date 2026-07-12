import { useFlag } from '@unleash/proxy-client-react';

export function useFeatureFlag(name: string): boolean {
  return useFlag(name);
}
