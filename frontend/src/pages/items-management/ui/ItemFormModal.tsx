import { useEffect } from 'react';

import { Checkbox, Form, Input, InputNumber, message, Modal, TimePicker } from 'antd';

import { getApiErrorMessage, getApiFieldErrors } from '@/shared/lib/api-error';
import { useLocalization } from '@/shared/lib/i18n';

import { useCreateItemDefinition, useUpdateItemDefinition } from '../api/itemDefinitionQueries';
import { buildCustomFieldRules, type ItemField } from '../model/itemField';
import { type ItemFormValues, toFormValues, toRequestBody } from '../model/itemForm';
import { fromTimePickerValue, TIME_FORMAT, toTimePickerValue } from '../model/time';
import type { ItemDefinition } from '../model/types';

interface ItemFormModalProps {
  open: boolean;
  editing: ItemDefinition | null;
  fields: ItemField[];
  onClose: () => void;
}

export function ItemFormModal({ open, editing, fields, onClose }: ItemFormModalProps) {
  const { t } = useLocalization();
  const [form] = Form.useForm<ItemFormValues>();

  const createMutation = useCreateItemDefinition();
  const updateMutation = useUpdateItemDefinition();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(editing ? toFormValues(editing, fields) : {});
  }, [open, editing, fields, form]);

  // Shows API field errors under their inputs. Returns false when some error
  // has no matching input, so the caller still reports it.
  const showFieldErrors = (errors: Record<string, string>) => {
    const known = new Set(fields.map((field) => field.fieldKey));
    const matched = Object.entries(errors).filter(([key]) => known.has(key));
    form.setFields(matched.map(([key, msg]) => ({ name: ['customValues', key], errors: [msg] })));
    return matched.length === Object.keys(errors).length;
  };

  // Runs from the form's onFinish, so Antd has already validated the values.
  const handleSubmit = async (values: ItemFormValues) => {
    const body = toRequestBody(values, fields);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Item updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Item created');
      }
      onClose();
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      if (fieldErrors && showFieldErrors(fieldErrors)) return;
      message.error(getApiErrorMessage(error, 'Request failed'));
    }
  };

  return (
    <Modal
      title={editing ? 'Edit item' : 'Add item'}
      open={open}
      onCancel={onClose}
      okText='Save'
      okButtonProps={{ htmlType: 'submit' }}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      forceRender
      // Wrap the whole panel, footer included, so OK/Cancel sit inside the
      // <form>: OK submits it and the buttons are scoped to the named form.
      modalRender={(dom) => (
        <Form
          form={form}
          layout='vertical'
          aria-label={t(
            editing ? 'itemsManagement.form.editLabel' : 'itemsManagement.form.addLabel',
          )}
          onFinish={handleSubmit}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        name='name'
        label='Name'
        rules={[{ required: true, whitespace: true, message: 'Name is required' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name='description' label='Description'>
        <Input.TextArea />
      </Form.Item>
      {fields.map((field) => (
        <Form.Item
          key={field.fieldKey}
          name={['customValues', field.fieldKey]}
          label={field.label}
          valuePropName={field.type === 'BOOLEAN' ? 'checked' : 'value'}
          rules={buildCustomFieldRules(field)}
          // The form holds TIME as "HH:mm:ss" text; the picker works with Dayjs.
          {...(field.type === 'TIME' && {
            getValueProps: (value: unknown) => ({ value: toTimePickerValue(value) }),
            normalize: fromTimePickerValue,
          })}
        >
          {renderCustomInput(field)}
        </Form.Item>
      ))}
    </Modal>
  );
}

// The input for one custom field's type. DATE and DATETIME use a plain text
// input for now. Only optional TIME fields can be cleared.
function renderCustomInput(field: ItemField) {
  switch (field.type) {
    case 'NUMBER':
      return <InputNumber className='w-full' />;
    case 'BOOLEAN':
      return <Checkbox />;
    case 'TIME':
      return <TimePicker format={TIME_FORMAT} allowClear={!field.required} className='w-full' />;
    default:
      return <Input />;
  }
}
