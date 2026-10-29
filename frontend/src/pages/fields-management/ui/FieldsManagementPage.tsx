import { useState } from 'react';

import { Button } from 'antd';

import type { FieldDefinition } from '../model/types';
import { FieldFormModal } from './FieldFormModal';
import { FieldsTable } from './FieldsTable';

export function FieldsManagementPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FieldDefinition | null>(null);

  const openModal = (field: FieldDefinition | null) => {
    setEditing(field);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <Button onClick={() => openModal(null)} type='primary'>
        Add field
      </Button>
      <FieldsTable onEdit={openModal} />
      <FieldFormModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
