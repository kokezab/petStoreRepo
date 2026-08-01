import { Input, InputNumber, Select, Switch } from 'antd';

import type { CodebookHooks, CodebookPermissions } from '../../core/types';
import { Codebook, useDefaultActionsColumn } from '../../index';
import { widgetSchema } from './schema';
import type { Widget } from './types';

interface Props {
  hooks: CodebookHooks<Widget>;
  permissions: CodebookPermissions<Widget>;
}

export function WidgetsCodebook({ hooks, permissions }: Props) {
  const actionsColumn = useDefaultActionsColumn<Widget>();

  return (
    <Codebook.Root<Widget>
      rowKey='id'
      hooks={hooks}
      permissions={permissions}
      schema={widgetSchema}
    >
      <Codebook.Toolbar title='Widgets' />
      <Codebook.Pager pageSize={10} showSizeChanger pageSizeOptions={[5, 10, 20]} />

      <Codebook.Table<Widget>
        columns={[
          { title: 'Name', dataIndex: 'name', sorter: true },
          { title: 'Category', dataIndex: 'category' },
          { title: 'Quantity', dataIndex: 'quantity', sorter: true },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active: boolean) => (active ? 'Yes' : 'No'),
          },
          { title: 'Status', dataIndex: 'status' },
        ]}
        actionsColumn={actionsColumn}
      />

      <Codebook.FormModal title='Widget'>
        <Codebook.Field name='name' label='Name'>
          <Input maxLength={60} />
        </Codebook.Field>
        <Codebook.Field name='category' label='Category'>
          <Select
            options={[
              { value: 'gadget', label: 'Gadget' },
              { value: 'gizmo', label: 'Gizmo' },
              { value: 'doohickey', label: 'Doohickey' },
            ]}
          />
        </Codebook.Field>
        <Codebook.Field name='quantity' label='Quantity'>
          <InputNumber min={0} />
        </Codebook.Field>
        <Codebook.Field name='active' label='Active'>
          <Switch />
        </Codebook.Field>
      </Codebook.FormModal>
    </Codebook.Root>
  );
}
