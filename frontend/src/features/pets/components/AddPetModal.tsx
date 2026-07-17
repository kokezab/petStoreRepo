import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Modal } from 'antd';

import type { PetStatus } from '@/api/generated/models';
import { getFindPetsByStatusQueryKey, useAddPet } from '@/api/generated/pet/pet';
import { useModalStore } from '@/stores/useModalStore';

import { AddPetForm } from './AddPetForm/AddPetForm';

type AddPetFormValues = {
  name: string;
  category: string;
  status: PetStatus;
};

export function AddPetModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const closeModal = useModalStore((state) => state.closeModal);
  const { mutate, isPending } = useAddPet();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: AddPetFormValues) => {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      mutate(
        {
          data: {
            photoUrls: [],
            name: values.name,
            category: {
              name: values.category,
            },
            status: values.status,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getFindPetsByStatusQueryKey() });
            closeModal();
            resolve();
          },
          onError: () => {
            setError('Error adding pet');
            reject();
          },
        },
      );
    });
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
