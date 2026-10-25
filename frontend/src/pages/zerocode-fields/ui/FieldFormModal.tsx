import { Modal } from 'antd';

import { useApiError } from '@/hooks/useApiError';
import { useLocalization } from '@/shared/lib/i18n';

import { useCreateField, useUpdateField } from '../api/fieldQueries';
import type { FieldFormValues } from '../model/types';
import { useFieldModalStore } from '../model/useFieldModalStore';
import { FieldForm } from './FieldForm/FieldForm';

export function FieldFormModal() {
  const { t } = useLocalization();
  const modal = useFieldModalStore((state) => state.modal);
  const close = useFieldModalStore((state) => state.close);
  const create = useCreateField();
  const update = useUpdateField();
  const { message: createError } = useApiError(create.error, t('fieldManagement.saveError'));
  const { message: updateError } = useApiError(update.error, t('fieldManagement.saveError'));

  const isEdit = modal.kind === 'edit';
  const isOpen = modal.kind === 'create' || isEdit;
  const title = isEdit ? t('fieldManagement.editForm.label') : t('fieldManagement.addForm.label');

  const handleClose = () => {
    create.reset();
    update.reset();
    close();
  };

  const handleSubmit = async (values: FieldFormValues) => {
    try {
      if (modal.kind === 'edit') {
        await update.updateField(modal.field.id, values);
      } else {
        await create.createField(values);
      }
      handleClose();
    } catch {
      // Failure is surfaced via the mutation error; keep the form open to retry.
    }
  };

  return (
    <Modal open={isOpen} title={title} onCancel={handleClose} footer={null} destroyOnHidden>
      {isOpen && (
        <FieldForm
          key={isEdit ? modal.field.id : 'create'}
          ariaLabel={title}
          initialValues={
            isEdit
              ? { label: modal.field.label, type: modal.field.type, required: modal.field.required }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={create.isPending || update.isPending}
          error={isEdit ? updateError : createError}
        />
      )}
    </Modal>
  );
}
