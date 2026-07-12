import { useState } from 'react';
import { Link } from 'react-router';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';
import type { FindPetsByStatusStatusItem } from '@/api/generated/models';

const STATUS_OPTIONS: FindPetsByStatusStatusItem[] = ['available', 'pending', 'sold'];

export function PetListPage() {
  const [status, setStatus] = useState<FindPetsByStatusStatusItem>('available');
  const { data, isLoading, error } = useFindPetsByStatus({ status: [status] });

  return (
    <div>
      <label>
        Status filter
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as FindPetsByStatusStatusItem)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {isLoading ? (
        <p role="status" aria-label="Loading pets">
          Loading pets…
        </p>
      ) : null}
      {error ? <p role="alert">Failed to load pets.</p> : null}
      {!isLoading && !error && data?.length === 0 && <p>No pets found</p>}
      {!isLoading && !error && data && data.length > 0 && (
        <ul aria-label="Pets" role="list">
          {data.map((pet) => (
            <li key={pet.id} role="listitem">
              <Link to={`/pets/${pet.id}`}>{pet.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
