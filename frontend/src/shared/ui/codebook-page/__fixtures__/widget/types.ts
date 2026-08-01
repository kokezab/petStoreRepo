export type WidgetCategory = 'gadget' | 'gizmo' | 'doohickey';
export type WidgetStatus = 'active' | 'done';

export interface Widget {
  id: number;
  name: string;
  category: WidgetCategory;
  quantity: number;
  active: boolean;
  /** Record lifecycle used to demo status-locked permissions (done = locked). */
  status: WidgetStatus;
}
