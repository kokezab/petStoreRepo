import { Alert, Button, Form, Input, InputNumber, Select, Space } from 'antd';

import type { OrderStatus } from '@/api/generated/models';

export type CreateOrderFormValues = {
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
};

interface CreateOrderFormProps {
  onSubmit: (values: CreateOrderFormValues) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

type OrderStatusOption = {
  label: string;
  value: OrderStatus;
};

const orderStatusOptions: OrderStatusOption[] = [
  { label: 'placed', value: 'placed' },
  { label: 'delivered', value: 'delivered' },
  { label: 'approved', value: 'approved' },
];

export function CreateOrderForm({ onSubmit, isLoading, error }: CreateOrderFormProps) {
  const [form] = Form.useForm<CreateOrderFormValues>();
  const handleSubmit = async () => {
    let values: CreateOrderFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    await onSubmit(values);
  };

  return (
    <Space orientation='vertical' style={{ width: '100%' }} size='large'>
      {error && <Alert type='error' title={error} showIcon />}
      <Form<CreateOrderFormValues> form={form} layout='vertical' aria-label='Create order'>
        <Form.Item
          name='petId'
          label='Pet Id'
          rules={[{ required: true, message: 'Pet is required' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name='quantity'
          label='Quantity'
          rules={[{ required: true, message: 'Quantity is required' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name='shipDate' label='Ship Date'>
          <Input />
        </Form.Item>

        <Form.Item name='status' label='Status'>
          <Select<OrderStatus, OrderStatusOption>
            aria-label='Status'
            options={orderStatusOptions}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type='primary' onClick={handleSubmit} loading={isLoading}>
            Create order
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
}
