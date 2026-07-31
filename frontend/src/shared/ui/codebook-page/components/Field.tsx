import { cloneElement, type ReactElement } from 'react';

import { Form } from 'antd';
import type { Rule } from 'antd/es/form';

import { useZodToAntd } from '@/shared/lib/zod-antd';

import { useCodebookContext } from '../core/context';

interface FieldProps {
  name: string;
  label: string;
  children: ReactElement<{ disabled?: boolean }>;
  /** Explicit rules override — otherwise derived automatically from Root's `schema` prop */
  rules?: Rule[];
  /** Explicit permission override — otherwise derived from context (canUpdate/canCreate) */
  can?: boolean;
}

export function Field({ name, label, children, rules, can }: FieldProps) {
  const { schema, editingRecord, permissions } = useCodebookContext();
  const zodToAntd = useZodToAntd();

  const resolvedRules = rules ?? (schema ? zodToAntd(schema, name) : []);
  const allowed =
    can ??
    (editingRecord ? permissions.canUpdate(editingRecord).enabled : permissions.canCreate.enabled);

  return (
    <Form.Item name={name} label={label} rules={resolvedRules}>
      {allowed ? children : cloneElement(children, { disabled: true })}
    </Form.Item>
  );
}
