import { usePlaceOrder } from '@/api/generated/store/store';
import { useApiError } from '@/hooks/useApiError';

import type { CreateOrderFormValues } from '../components/CreateOrderForm/CreateOrderForm';

export function useCreateOrder() {
  const {
    mutateAsync,
    isPending,
    error: mutationError,
    reset,
  } = usePlaceOrder({
    mutation: { meta: { skipGlobalErrorToast: true } },
  });
  const { message: error } = useApiError(mutationError, 'Error creating order');

  const createOrder = async (values: CreateOrderFormValues) => {
    reset();
    await mutateAsync({
      data: {
        petId: values.petId,
        quantity: values.quantity,
        shipDate: values.shipDate,
        status: values.status,
      },
    });
  };

  return { createOrder, isPending, error };
}
