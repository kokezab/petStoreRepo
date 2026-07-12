import { useGetInventory } from "@/api/generated/store/store";

export function InventoryPage() {
    const { data: inventory, isLoading, isError } = useGetInventory();

    if (isError) {
        return <p role="alert">Failed to load inventory.</p>;
    }

    if (isLoading) {
        return <p role="status" aria-label="Loading inventory">Loading inventory…</p>;
    }

    return <div>
        <h1>Inventory</h1>
        {inventory && Object.entries(inventory).map(([status, count]) => <p key={status}>{status}: {count}</p>)}
    </div>
}