import { useFindPetsByStatus } from '@/api/generated/pet/pet'

export default function App() {
  const { data, isLoading, error } = useFindPetsByStatus({ status: ['pending'] })

  if (isLoading) return <div>Loading pets...</div>
  if (error) return <div>Error loading pets</div>

  return (
    <div>
      <h1>Pending pets ({data?.length ?? 0})</h1>
      <ul>
        {data?.slice(0, 10).map((pet) => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
    </div>
  )
}