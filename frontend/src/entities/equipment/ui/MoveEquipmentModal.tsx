import { useState } from 'react';

import { ApartmentOutlined } from '@ant-design/icons';
import { App, Button, Modal, Select, Space, Tooltip } from 'antd';

import { useGetEquipment } from '@/api/generated/tracer/equipment-query-controller/equipment-query-controller';
import { tracerRequest } from '@/shared/api';
import { useLocalization } from '@/shared/lib/i18n';
import type { PermissionResult } from '@/shared/ui/codebook-page';

import { useMoveEquipment } from '../api';
import { normalizeEquipment } from '../api/normalizeEquipment';
import type { Equipment } from '../model/types';

// Sentinel for the "no parent (root)" option. The Select can't use `undefined` as
// a value (antd treats it as "nothing selected"), so we map this to
// `parentId: undefined` when submitting.
const ROOT = '__root__';

type ParentValue = number | typeof ROOT;

/**
 * Row action that opens the Move modal. Mirrors the codebook's EditAction:
 * hidden when the caller lacks the RBAC permission, disabled with a tooltip
 * when the record's business state locks it (e.g. inactive/done).
 */
export function MoveEquipmentButton({
  permission,
  onClick,
}: {
  permission: PermissionResult;
  onClick: () => void;
}) {
  const { t } = useLocalization();
  const { visible, enabled, reason } = permission;
  if (!visible) return null;

  const btn = (
    <Button
      icon={<ApartmentOutlined />}
      aria-label={t('equipment.move.title')}
      disabled={!enabled}
      onClick={onClick}
    />
  );
  // A disabled antd Button doesn't fire pointer/focus events, so a Tooltip
  // wrapping it directly never shows — wrap in a span so the Tooltip has a
  // non-disabled element to attach its listeners to.
  return !enabled && reason ? (
    <Tooltip title={t(reason)}>
      <span>{btn}</span>
    </Tooltip>
  ) : (
    btn
  );
}

/**
 * Modal for re-parenting an equipment. Open state is driven by `record`: a
 * non-null record opens it; `onClose` clears it. The body is a separate,
 * record-keyed component so its selection state initializes fresh from the
 * record on each open (no reset-in-effect), while this outer wrapper keeps the
 * Modal mounted so open/close animate normally.
 */
export function MoveEquipmentModal({
  record,
  onClose,
}: {
  record: Equipment | null;
  onClose: () => void;
}) {
  const { t } = useLocalization();
  return (
    <Modal
      title={t('equipment.move.title')}
      open={record !== null}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {record && <MoveEquipmentForm key={record.id} record={record} onClose={onClose} />}
    </Modal>
  );
}

function MoveEquipmentForm({ record, onClose }: { record: Equipment; onClose: () => void }) {
  const { t } = useLocalization();
  const { message } = App.useApp();
  const move = useMoveEquipment();
  const [value, setValue] = useState<ParentValue>(record.parentId ?? ROOT);

  // Reuses the already-cached equipment list query (no extra request), excluding
  // the record itself. Cycle prevention beyond self is left to the backend, which
  // rejects invalid moves with an error surfaced via antd's message.
  const listQuery = useGetEquipment({
    query: { select: (data) => data.map(normalizeEquipment) },
    request: tracerRequest,
  });

  const options = [
    { value: ROOT, label: t('equipment.move.root') },
    ...(listQuery.data ?? [])
      .filter((e) => e.id !== record.id)
      .map((e) => ({ value: e.id, label: e.name })),
  ];

  const handleOk = async () => {
    const parentId = value === ROOT ? undefined : value;
    try {
      await move.mutateAsync({ id: record.id, parentId });
    } catch {
      message.error(t('equipment.move.error'));
      return;
    }
    message.success(t('equipment.move.success'));
    onClose();
  };

  return (
    <>
      <Select
        style={{ width: '100%' }}
        aria-label={t('equipment.move.parentLabel')}
        loading={listQuery.isFetching}
        value={value}
        onChange={setValue}
        options={options}
        showSearch
        optionFilterProp='label'
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={onClose}>{t('codebook.cancel')}</Button>
          <Button type='primary' loading={move.isPending} onClick={handleOk}>
            {t('codebook.ok')}
          </Button>
        </Space>
      </div>
    </>
  );
}
