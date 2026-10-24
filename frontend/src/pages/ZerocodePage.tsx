import { useList } from '@/api/generated/zerocode/item-controller/item-controller';
import { zerocodeRequest } from '@/shared/api';

export default function ZerocodePage() {
  // Generated react-query hook. `request: zerocodeRequest` overrides the shared
  // axios instance's default base URL so this call actually reaches the
  // Zero-Code backend at http://localhost:8090/api/items.
  const { data, isPending, isError, error } = useList({ request: zerocodeRequest });

  return (
    <div>
      <h1>Zero-Code Entity</h1>

      {isPending && <p>Loading items…</p>}

      {isError && <p style={{ color: 'crimson' }}>Failed to load items: {String(error)}</p>}

      {data && (
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              {item.description ? ` — ${item.description}` : ''}
              {item.customValues && (
                <code style={{ marginLeft: 8 }}>{JSON.stringify(item.customValues)}</code>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
