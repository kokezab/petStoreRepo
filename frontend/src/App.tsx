import { useFindPetsByStatus, useGetPetById } from '@/api/generated/pet/pet'

function PetById({ id }: { id: number }) {
  const { data, isLoading, error } = useGetPetById(id);

  if (isLoading) return <div>Loading pets...</div>
  if (error) return <div>Error loading pets</div>

  return (
    <div>
      <h1>{data?.name}</h1>
    </div>
  )
}

export default function App() {
  const { data, isLoading, error } = useFindPetsByStatus({ status: ['available'] });

  if (isLoading) return <div>Loading pets...</div>
  if (error) return <div>Error loading pets</div>

  return (
    <div>
      <PetById id={1} />
      {data?.map((pet) => (
        <h2>{pet.name}</h2>
      ))}
    </div>
  )
}
