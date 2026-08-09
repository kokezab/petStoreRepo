import { Alert, Button, Form, Input, Space } from 'antd';

import type { User } from '@/api/generated/models';
import { useLocalization } from '@/shared/lib/i18n';

export interface BulkUserFormValues {
  users: User[];
}

interface BulkUserFormProps {
  onSubmit: (users: User[]) => Promise<boolean>;
  isLoading: boolean;
  error?: string | null;
}

export function BulkUserForm({ onSubmit, isLoading, error }: BulkUserFormProps) {
  const { t } = useLocalization();
  const [form] = Form.useForm<BulkUserFormValues>();

  const handleSubmit = async () => {
    let values: BulkUserFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const ok = await onSubmit(values.users ?? []);
    if (!ok) return;

    form.resetFields();
    form.setFieldsValue({ users: [{}] });
  };

  return (
    <Space orientation='vertical' style={{ width: '100%' }} size='large'>
      {error && <Alert type='error' title={error} showIcon />}
      <Form<BulkUserFormValues>
        form={form}
        layout='vertical'
        aria-label={t('bulkUserCreation.form.label')}
        initialValues={{ users: [{}] }}
      >
        <Form.List name='users'>
          {(fields, { add, remove }) => (
            <Space orientation='vertical' style={{ width: '100%' }} size='middle'>
              {fields.map((field, index) => (
                <fieldset
                  key={field.key}
                  aria-label={t('bulkUserCreation.form.userRowLabel', { number: index + 1 })}
                  style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}
                >
                  <Form.Item name={[field.name, 'username']} label='Username'>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[field.name, 'firstName']} label='First Name'>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[field.name, 'lastName']} label='Last Name'>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[field.name, 'email']} label='Email'>
                    <Input type='email' />
                  </Form.Item>
                  <Form.Item name={[field.name, 'password']} label='Password'>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name={[field.name, 'phone']} label='Phone' style={{ marginBottom: 0 }}>
                    <Input />
                  </Form.Item>
                  <Button
                    onClick={() => remove(field.name)}
                    disabled={fields.length === 1}
                    title='Remove user'
                    style={{ marginTop: 8 }}
                  >
                    -
                  </Button>
                </fieldset>
              ))}
              <Button onClick={() => add()} title='Add user'>
                +
              </Button>
            </Space>
          )}
        </Form.List>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type='primary' onClick={handleSubmit} loading={isLoading}>
            Create users
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
}
