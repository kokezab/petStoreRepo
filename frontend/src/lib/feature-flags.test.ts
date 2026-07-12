import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useFlag } from '@unleash/proxy-client-react';

import { useFeatureFlag } from './feature-flags';

vi.mock('@unleash/proxy-client-react', () => ({
  useFlag: vi.fn(),
}));

const mockedUseFlag = vi.mocked(useFlag);

describe('useFeatureFlag', () => {
  it('returns true when the underlying flag is enabled', () => {
    mockedUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useFeatureFlag('pet-creation'));

    expect(result.current).toBe(true);
    expect(mockedUseFlag).toHaveBeenCalledWith('pet-creation');
  });

  it('returns false when the underlying flag is disabled', () => {
    mockedUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useFeatureFlag('pet-creation'));

    expect(result.current).toBe(false);
  });
});
