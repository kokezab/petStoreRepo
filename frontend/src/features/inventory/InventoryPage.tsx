import { useGetInventory } from '@/api/generated/store/store';
import { QueryState } from '@/components/QueryState/QueryState';

export function InventoryPage() {
  const { data: inventory, isLoading, error } = useGetInventory();

  return (
    <div>
      <h1>Inventory</h1>
      <QueryState
        isLoading={isLoading}
        error={error}
        data={inventory}
        loadingLabel='Loading inventory'
        errorFallback='Failed to load inventory.'
      >
        {(inventory) =>
          Object.entries(inventory).map(([status, count]) => (
            <p key={status}>
              {status}: {count}
            </p>
          ))
        }
      </QueryState>
    </div>
  );
}
