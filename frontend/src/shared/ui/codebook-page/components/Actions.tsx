import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';

import { useCodebookContext } from '../core/context';

export function EditAction<T extends object>({ record }: { record: T }) {
  const { t } = useLocalization();
  const { openEdit, permissions } = useCodebookContext<T>();
  const { visible, enabled, reason } = permissions.canUpdate(record);
  if (!visible) return null;

  const btn = (
    <Button icon={<EditOutlined />} disabled={!enabled} onClick={() => openEdit(record)} />
  );
  return !enabled && reason ? <Tooltip title={t(reason)}>{btn}</Tooltip> : btn;
}

export function DeleteAction<T extends object>({
  record,
  confirmTitle,
}: {
  record: T;
  confirmTitle?: string;
}) {
  const { t } = useLocalization();
  const { remove, permissions } = useCodebookContext<T>();
  const { visible, enabled, reason } = permissions.canDelete(record);
  if (!visible) return null;

  const btn = <Button icon={<DeleteOutlined />} danger disabled={!enabled} />;
  const wrapped = !enabled && reason ? <Tooltip title={t(reason)}>{btn}</Tooltip> : btn;

  return enabled ? (
    <Popconfirm
      title={confirmTitle ?? t('codebook.confirmDelete')}
      onConfirm={() => remove(record)}
    >
      {wrapped}
    </Popconfirm>
  ) : (
    wrapped
  );
}
