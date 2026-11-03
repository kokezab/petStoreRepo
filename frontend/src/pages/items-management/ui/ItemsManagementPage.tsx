import { useState } from 'react';

import { Button } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/shared/lib/feature-flags';

import { useItemFields } from '../api/itemFieldQueries';
import type { ItemDefinition } from '../model/types';
import { ItemFormModal } from './ItemFormModal';
import { ItemsTable } from './ItemsTable';

export function ItemsManagementPage() {
  const canManage = useFeatureFlag(FEATURE_FLAGS.itemsManagement);
  const { data: fields } = useItemFields();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemDefinition | null>(null);

  const openModal = (item: ItemDefinition | null) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div>
      {canManage && (
        <Button onClick={() => openModal(null)} type='primary'>
          Add item
        </Button>
      )}
      <ItemsTable fields={fields ?? []} onEdit={canManage ? openModal : undefined} />
      {canManage && (
        <ItemFormModal
          open={modalOpen}
          editing={editing}
          fields={fields ?? []}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
