import { Button, Form, Input } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';

export interface CreateOrganizationalUnitFormValues {
  name: string;
}

interface CreateOrganizationalUnitFormProps {
  onCreate: (name: string) => void;
}

export function CreateOrganizationalUnitForm({ onCreate }: CreateOrganizationalUnitFormProps) {
  const { t } = useLocalization();
  const [form] = Form.useForm<CreateOrganizationalUnitFormValues>();

  const handleSave = async () => {
    let values: CreateOrganizationalUnitFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // Validation errors are rendered inline by Antd Form; keep the form open.
      return;
    }

    onCreate(values.name);
    form.resetFields();
  };

  return (
    <Form<CreateOrganizationalUnitFormValues>
      form={form}
      layout='vertical'
      aria-label={t('organizationalUnit.createForm.label')}
    >
      <Form.Item
        name='name'
        label={t('organizationalUnit.createForm.nameLabel')}
        rules={[{ required: true, message: t('organizationalUnit.createForm.nameRequired') }]}
      >
        <Input />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type='primary' onClick={handleSave}>
          {t('organizationalUnit.createForm.saveButton')}
        </Button>
      </Form.Item>
    </Form>
  );
}
