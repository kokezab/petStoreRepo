import { Alert, Button, Checkbox, Form, Input, Select, Space } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';

import { FIELD_TYPES, type FieldFormValues } from '../../model/types';

interface FieldFormProps {
  ariaLabel: string;
  initialValues?: Partial<FieldFormValues>;
  onSubmit: (values: FieldFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

const typeOptions = FIELD_TYPES.map((type) => ({ value: type, label: type }));

export function FieldForm({
  ariaLabel,
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: FieldFormProps) {
  const { t } = useLocalization();
  const [form] = Form.useForm<FieldFormValues>();

  const handleSubmit = async () => {
    let values: FieldFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    await onSubmit({ ...values, required: values.required ?? false });
  };

  return (
    <Space orientation='vertical' style={{ width: '100%' }} size='large'>
      {error && <Alert type='error' title={error} showIcon />}
      <Form<FieldFormValues>
        form={form}
        layout='vertical'
        aria-label={ariaLabel}
        initialValues={{ required: false, ...initialValues }}
      >
        <Form.Item
          name='label'
          label={t('fieldManagement.form.labelLabel')}
          rules={[
            { required: true, whitespace: true, message: t('fieldManagement.form.labelRequired') },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='type'
          label={t('fieldManagement.form.typeLabel')}
          rules={[{ required: true, message: t('fieldManagement.form.typeRequired') }]}
        >
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item name='required' valuePropName='checked'>
          <Checkbox>{t('fieldManagement.form.requiredLabel')}</Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>{t('fieldManagement.cancel')}</Button>
            <Button type='primary' onClick={handleSubmit} loading={isLoading}>
              {t('fieldManagement.save')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  );
}
