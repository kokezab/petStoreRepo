import { Modal } from 'antd';

import { useModalStore } from '@/stores/useModalStore';

import { useCreatePet } from '../hooks/useCreatePet';
import { AddPetForm, type AddPetFormValues } from './AddPetForm/AddPetForm';

export function AddPetModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const closeModal = useModalStore((state) => state.closeModal);
  const { createPet, isPending, error } = useCreatePet();

  const handleSubmit = async (values: AddPetFormValues) => {
    try {
      await createPet(values);
      closeModal();
    } catch {
      // Failure is surfaced via `error`; keep the modal open so the user can retry.
    }
  };

  return (
    <Modal open={isOpen} title='Add pet' onCancel={closeModal} footer={null}>
      <AddPetForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        error={error}
        onCancel={closeModal}
      />
    </Modal>
  );
}
