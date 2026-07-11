import { useFindPetsByStatus, useGetPetById } from '@/api/generated/pet/pet'

export default function App() {
  const { data, isLoading, error } = useGetPetById(9223372016900019091);

  if (isLoading) return <div>Loading pets...</div>
  if (error) return <div>Error loading pets</div>

  return (
    <div>
      <h1>{data?.name}</h1>
    </div>
  )
}