import { useFlag } from '@unleash/proxy-client-react';

export const FEATURE_FLAGS = {
  petCreation: 'pet-creation',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export function useFeatureFlag(name: FeatureFlag): boolean {
  return useFlag(name);
}
