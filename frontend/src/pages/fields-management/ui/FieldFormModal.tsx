import { useEffect } from 'react';

import { Checkbox, DatePicker, Form, Input, InputNumber, message, Modal, Select } from 'antd';

import { getApiErrorMessage } from '@/shared/lib/api-error';

import { useCreateFieldDefinition, useUpdateFieldDefinition } from '../api/fieldDefinitionQueries';
import { buildConstraints, type FieldFormValues, toFormValues } from '../model/fieldForm';
import { FIELD_TYPES, type FieldDefinition } from '../model/types';

interface FieldFormModalProps {
  open: boolean;
  /** The field being edited, or null when creating a new one. */
  editing: FieldDefinition | null;
  onClose: () => void;
}

const TYPE_OPTIONS = FIELD_TYPES.map((type) => ({ value: type, label: type }));

/** Picker settings for the DATE / DATETIME min-max constraint inputs. */
const DATE_PICKERS = {
  DATE: { noun: 'date', format: 'YYYY-MM-DD', showTime: false },
  DATETIME: { noun: 'date and time', format: 'YYYY-MM-DD HH:mm', showTime: { format: 'HH:mm' } },
} as const;

export function FieldFormModal({ open, editing, onClose }: FieldFormModalProps) {
  const [form] = Form.useForm<FieldFormValues>();
  const selectedType = Form.useWatch('type', form);
  const minDate = Form.useWatch('minDate', form);
  const datePicker =
    selectedType === 'DATE' || selectedType === 'DATETIME' ? DATE_PICKERS[selectedType] : null;

  const createMutation = useCreateFieldDefinition();
  const updateMutation = useUpdateFieldDefinition();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(editing ? toFormValues(editing) : { required: false });
  }, [open, editing, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const constraints = buildConstraints(values);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          body: {
            // type is immutable on the backend (409), so it is not sent on update.
            label: values.label,
            required: !!values.required,
            constraints,
            displayOrder: editing.displayOrder,
          },
        });
        message.success('Field updated');
      } else {
        await createMutation.mutateAsync({
          label: values.label,
          type: values.type,
          required: !!values.required,
          constraints,
        });
        message.success('Field created');
      }
      onClose();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Request failed'));
    }
  };

  return (
    <Modal
      title={editing ? 'Edit field' : 'Add field'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText={editing ? 'Save' : 'Create'}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      forceRender
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          name='label'
          label='Label'
          rules={[{ required: true, whitespace: true, message: 'Label is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name='type'
          label='Type'
          rules={[{ required: true, message: 'Type is required' }]}
        >
          <Select disabled={!!editing} options={TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name='required' valuePropName='checked'>
          <Checkbox>Required</Checkbox>
        </Form.Item>
        {selectedType === 'TEXT' && (
          <Form.Item name='maxLength' label='Max length'>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {selectedType === 'NUMBER' && (
          <>
            <Form.Item name='min' label='Min'>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name='max'
              label='Max'
              dependencies={['min']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const min = getFieldValue('min');
                    if (value == null || min == null || value >= min) return Promise.resolve();
                    return Promise.reject(new Error('Max must be >= min'));
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {datePicker && (
          <>
            <Form.Item name='minDate' label={`Earliest ${datePicker.noun}`}>
              <DatePicker
                showTime={datePicker.showTime}
                format={datePicker.format}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name='maxDate'
              label={`Latest ${datePicker.noun}`}
              dependencies={['minDate']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const earliest = getFieldValue('minDate');
                    if (!value || !earliest || !value.isBefore(earliest)) return Promise.resolve();
                    return Promise.reject(
                      new Error(`Latest ${datePicker.noun} must not be before the earliest`),
                    );
                  },
                }),
              ]}
            >
              <DatePicker
                showTime={datePicker.showTime}
                format={datePicker.format}
                disabledDate={(current) => !!minDate && current.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
