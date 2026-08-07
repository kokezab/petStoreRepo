import { type ReactNode, useEffect } from 'react';

import { Form, Modal } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';

import { useCodebookContext } from '../core/context';

interface FormModalProps {
  /** Already-translated entity name, e.g. t('countries.entityName') -> "Country" */
  title: string;
  children: ReactNode;
}

export function FormModal<T extends object>({ title, children }: FormModalProps) {
  const { t } = useLocalization();
  const { modalOpen, closeModal, submit, editingRecord, isSubmitting } = useCodebookContext<T>();
  const [form] = Form.useForm();

  useEffect(() => {
    if (modalOpen) {
      form.setFieldsValue(editingRecord ?? {});
    } else {
      form.resetFields();
    }
  }, [modalOpen, editingRecord, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await submit(values);
  };

  const handleCancel = () => {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: t('codebook.discardChangesTitle'),
        content: t('codebook.discardChangesBody'),
        okText: t('codebook.discard'),
        okButtonProps: { danger: true },
        cancelText: t('codebook.keepEditing'),
        onOk: closeModal,
      });
      return;
    }
    closeModal();
  };

  return (
    <Modal
      title={
        editingRecord
          ? t('codebook.editTitle', { entity: title })
          : t('codebook.createTitle', { entity: title })
      }
      open={modalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      destroyOnHidden
    >
      <Form form={form} layout='vertical'>
        {children}
      </Form>
    </Modal>
  );
}
