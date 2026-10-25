import { Alert, Modal, Typography } from 'antd';

import { useApiError } from '@/hooks/useApiError';
import { useLocalization } from '@/shared/lib/i18n';

import { useDeleteField } from '../api/fieldQueries';
import { useFieldModalStore } from '../model/useFieldModalStore';

export function DeleteFieldModal() {
  const { t } = useLocalization();
  const modal = useFieldModalStore((state) => state.modal);
  const close = useFieldModalStore((state) => state.close);
  const { deleteField, isPending, error: mutationError, reset } = useDeleteField();
  const { message: error } = useApiError(mutationError, t('fieldManagement.deleteError'));

  const handleClose = () => {
    reset();
    close();
  };

  const handleConfirm = async () => {
    if (modal.kind !== 'delete') return;
    try {
      await deleteField(modal.field.id);
      handleClose();
    } catch {
      // Failure is surfaced via `error`; keep the dialog open so the user can retry.
    }
  };

  return (
    <Modal
      open={modal.kind === 'delete'}
      title={t('fieldManagement.deleteDialog.title')}
      okText={t('fieldManagement.delete')}
      cancelText={t('fieldManagement.cancel')}
      okButtonProps={{ danger: true, loading: isPending }}
      onOk={handleConfirm}
      onCancel={handleClose}
      destroyOnHidden
    >
      {error && <Alert type='error' title={error} showIcon style={{ marginBottom: 16 }} />}
      {modal.kind === 'delete' && (
        <Typography.Paragraph>
          {t('fieldManagement.deleteDialog.body', { label: modal.field.label })}
        </Typography.Paragraph>
      )}
    </Modal>
  );
}
