import { showSuccessMessage } from '@/lib/antd-message-bridge';
import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';

import { useCreateOrder } from './model/useCreateOrder';
import { CreateOrderForm, type CreateOrderFormValues } from './ui/CreateOrderForm/CreateOrderForm';

export function OrdersPage() {
  const isOrderCreationEnabled = useFeatureFlag(FEATURE_FLAGS.orderCreation);
  const { createOrder, isPending, error } = useCreateOrder();

  const handleSubmit = async (values: CreateOrderFormValues) => {
    try {
      await createOrder(values);
      showSuccessMessage('Order created successfully');
    } catch {
      // Failure is surfaced via `error`.
    }
  };

  return (
    <div>
      {isOrderCreationEnabled && (
        <CreateOrderForm onSubmit={handleSubmit} isLoading={isPending} error={error} />
      )}
    </div>
  );
}
