import { Modal } from 'antd';

import { useAddPet } from '@/api/generated/pet/pet';
import { useModalStore } from '@/stores/useModalStore';

import { AddPetForm, type AddPetFormValues } from './AddPetForm/AddPetForm';

export function AddPetModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const { mutateAsync: createPet, isPending } = useAddPet();

  const handleSubmit = async (values: AddPetFormValues) => {
    await createPet({
      data: {
        photoUrls: [],
        name: values.name,
        category: { name: values.category },
        status: values.status,
      },
    });
  };

  return (
    <Modal open={isOpen} title='Add pet' footer={null}>
      <AddPetForm onSubmit={handleSubmit} isLoading={isPending} />
    </Modal>
  );
}
