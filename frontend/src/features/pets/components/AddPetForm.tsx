import type { PetStatus } from '@/api/generated/models';
import { Alert, Button, Space } from 'antd';
import { useRef } from 'react';

type AddPetFormValues = {
  name: string;
  category: string;
  status: PetStatus;
};

interface AddPetFormProps {
  onSubmit: (values: AddPetFormValues) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function AddPetForm({ onSubmit, isLoading, error }: AddPetFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = async () => {
    const name = nameRef.current?.value.trim();
    const category = categoryRef.current?.value.trim();
    const status = statusRef.current?.value as PetStatus;

    if (!name) return;
    if (!category) return;
    if (!status) return;

    await onSubmit({ name, category, status });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Name</label>
        <input
          id="name"
          type="text"
          ref={nameRef}
          placeholder="Pet name"
          required
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
        />
      </div>
      <div>
        <label htmlFor="category" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Category</label>
        <input
          id="category"
          type="text"
          ref={categoryRef}
          placeholder="Pet category"
          required
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
        />
      </div>
      <div>
        <label htmlFor="status" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status</label>
        <select
          id="status"
          ref={statusRef}
          required
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
        >
          <option value="">Select status</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
      </div>
      <Button type="primary" block onClick={handleSubmit} loading={isLoading}>
        Save
      </Button>
    </Space>
  );
}
