import { PlusOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import type { ReactNode } from 'react';

import { useLocalization } from '@/shared/lib/i18n';

import { useCodebookContext } from '../core/context';

interface ToolbarProps {
  title: string;
  /** Override the default "Add" label (e.g. already-translated string) */
  addLabel?: string;
  extra?: ReactNode;
}

export function Toolbar({ title, addLabel, extra }: ToolbarProps) {
  const { t } = useLocalization();
  const { openCreate, permissions } = useCodebookContext();
  const { visible, enabled, reason } = permissions.canCreate;

  const renderAddButton = () => {
    const btn = (
      <Button type='primary' icon={<PlusOutlined />} disabled={!enabled} onClick={openCreate}>
        {addLabel ?? t('codebook.add')}
      </Button>
    );
    return !enabled && reason ? <Tooltip title={t(reason)}>{btn}</Tooltip> : btn;
  };

  return (
    <Space
      style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%', display: 'flex' }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      <Space>
        {extra}
        {visible && renderAddButton()}
      </Space>
    </Space>
  );
}
