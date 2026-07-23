import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { getFindPetsByStatusQueryKey, useAddPet } from '@/api/generated/pet/pet';

import { useCreatePet } from './useCreatePet';

vi.mock('@/api/generated/pet/pet', () => ({
  useAddPet: vi.fn(),
  getFindPetsByStatusQueryKey: vi.fn(() => ['/pet/findByStatus']),
}));

const mockedUseAddPet = vi.mocked(useAddPet);

function mockAddPet(
  overrides: Partial<{ mutateAsync: unknown; error: unknown; reset: unknown }> = {},
) {
  mockedUseAddPet.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAddPet>);
}

function renderUseCreatePet() {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreatePet(), { wrapper });
  return { result, invalidateSpy };
}

const values = { name: 'Buddy', category: 'Dog', status: 'available' as const };

describe('useCreatePet', () => {
  it('opts out of the global error toast', () => {
    mockAddPet();
    renderUseCreatePet();

    expect(mockedUseAddPet).toHaveBeenCalledWith({
      mutation: { meta: { skipGlobalErrorToast: true } },
    });
  });

  it('maps form values to a Pet payload and invalidates the list cache on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockAddPet({ mutateAsync });
    const { result, invalidateSpy } = renderUseCreatePet();

    await act(async () => {
      await result.current.createPet(values);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      data: {
        photoUrls: [],
        name: 'Buddy',
        category: { name: 'Dog' },
        status: 'available',
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getFindPetsByStatusQueryKey(),
    });
    expect(result.current.error).toBeNull();
  });

  it('rejects when the mutation fails and exposes the error message', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'));
    // Mirrors react-query populating the mutation error after a failure.
    mockAddPet({ mutateAsync, error: new Error('Error adding pet') });
    const { result, invalidateSpy } = renderUseCreatePet();

    await expect(
      act(async () => {
        await result.current.createPet(values);
      }),
    ).rejects.toThrow('boom');

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Error adding pet');
  });
});
