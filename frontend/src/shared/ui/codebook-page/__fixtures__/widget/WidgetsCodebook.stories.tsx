import type { Meta, StoryObj } from '@storybook/react-vite';

import { withProviders } from '../../__stories__/decorators';
import { createWidgetHooks } from './hooks';
import { buildWidgetPermissions } from './permissions';
import { createWidgetStore, seedWidgets } from './store';
import { WidgetsCodebook } from './WidgetsCodebook';

const allowAll = buildWidgetPermissions({ can: () => true });

const meta: Meta<typeof WidgetsCodebook> = {
  title: 'codebook-page/Widgets',
  component: WidgetsCodebook,
  decorators: [withProviders],
};
export default meta;
type Story = StoryObj<typeof WidgetsCodebook>;

export const ClientMode: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
};
export const ServerMode: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'server', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
};
export const Loading: Story = {
  args: {
    hooks: createWidgetHooks({
      mode: 'client',
      store: createWidgetStore(seedWidgets),
      latencyMs: 100000,
    }),
    permissions: allowAll,
  },
};
export const Empty: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore([]) }),
    permissions: allowAll,
  },
};
export const ListError: Story = {
  args: {
    hooks: createWidgetHooks({
      mode: 'client',
      store: createWidgetStore(seedWidgets),
      failList: true,
    }),
    permissions: allowAll,
  },
};
export const PermissionGated: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: buildWidgetPermissions({ can: (action) => action !== 'create' }),
  },
};
