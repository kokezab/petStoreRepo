import { Table } from 'antd';

import { useGetFields } from '@/api/generated/zerocode/field-definition-controller/field-definition-controller';
import type { ItemResponse } from '@/api/generated/zerocode/models/itemResponse';
import { zerocodeRequest } from '@/shared/api';

export default function ZerocodePage() {
  // Generated react-query hook. `request: zerocodeRequest` overrides the shared
  // axios instance's default base URL so this call actually reaches the
  // Zero-Code backend (via the /zerocode-api dev proxy) at /api/fields.
  // Swap to `useGetItems` (item-controller) to list items instead.
  const { data, isPending, isError, error } = useGetFields({ request: zerocodeRequest });

  return (
    <div>
      <h1>Fields</h1>

      {isPending && <p>Loading field definitions…</p>}

      {isError && <p style={{ color: 'crimson' }}>Failed to load fields: {String(error)}</p>}

      {/*
        NOTE: the generated return type here is wrong. The backend spec declares
        GET /api/fields as returning `Response[]` (the item shape) and emits an
        empty `FieldDefinitionResponse`, so the typed properties (fieldKey, label,
        type, ...) aren't visible to TS even though they ARE present at runtime.
        Rendering raw JSON until the backend spec is fixed (see @Operation /
        @Schema annotations on FieldDefinitionController). */}
      {data && (
        <Table<ItemResponse>
          dataSource={data}
          columns={[
            { title: 'fieldKey', dataIndex: 'fieldKey', key: 'fieldKey' },
            { title: 'label', dataIndex: 'label', key: 'label' },
            { title: 'type', dataIndex: 'type', key: 'type' },
            { title: 'required', dataIndex: 'required', key: 'required' },
            { title: 'constraints', dataIndex: 'constraints', key: 'constraints' },
          ]}
        />
      )}
    </div>
  );
}
