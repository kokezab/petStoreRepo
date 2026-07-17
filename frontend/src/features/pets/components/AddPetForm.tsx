import { Alert, Button, Form, Input, Select, Space } from 'antd';

import type { PetStatus } from '@/api/generated/models';

type AddPetFormValues = {
  name: string;
  category: string;
  status: PetStatus;
};

interface AddPetFormProps {
  onSubmit: (values: AddPetFormValues) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onCancel?: () => void;
}

const options: { value: PetStatus; label: string }[] = [
  {
    value: 'available',
    label: 'available',
  },
  {
    value: 'pending',
    label: 'pending',
  },
  {
    value: 'sold',
    label: 'sold',
  },
];

export function AddPetForm({ onSubmit, isLoading, error, onCancel }: AddPetFormProps) {
  const [form] = Form.useForm<AddPetFormValues>();
  const handleSubmit = async () => {
    let values: AddPetFormValues;
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
      <Form<AddPetFormValues> form={form} layout='vertical'>
        <Form.Item
          name='name'
          label='Name'
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='category'
          label='Category'
          rules={[{ required: true, message: 'Category is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='status'
          label='Status'
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select options={options} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type='primary' onClick={handleSubmit} loading={isLoading}>
              Save
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  );
}
