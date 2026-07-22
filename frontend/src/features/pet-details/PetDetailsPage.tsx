import { Button } from 'antd';
import { useParams } from 'react-router';

import { useGetPetById } from '@/api/generated/pet/pet';
import { QueryState } from '@/components/QueryState/QueryState';

export function PetDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: pet,
    isLoading,
    error,
  } = useGetPetById(Number(id), {
    query: { meta: { skipGlobalErrorToast: true } },
  });

  return (
    <div>
      <Button type='link' href='/pets'>
        Back to list
      </Button>
      <QueryState
        isLoading={isLoading}
        error={error}
        data={pet}
        loadingLabel='Loading pet'
        errorFallback='Pet not found'
      >
        {(pet) => (
          <>
            <h1 className='uppercase'>{pet.name}</h1>
            <h2>{pet.status}</h2>
            <h3>{pet.category?.name}</h3>
            <h3>{pet.tags?.map((tag) => tag.name).join(', ')}</h3>
            <div>
              {pet.photoUrls?.map((photoUrl) => (
                <img key={photoUrl} src={photoUrl} alt={pet.name} />
              ))}
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
