import type { Rule } from 'antd/es/form';

import { LOCAL_DATETIME_PATTERN } from './dateTime';
import type { CustomFieldColumn } from './itemColumns';

export interface ItemFieldConstraints {
  maxLength?: number;
  min?: number;
  max?: number;
}

// A custom field as the items page uses it: a table column and a form input.
export interface ItemField extends CustomFieldColumn {
  required: boolean;
  constraints: ItemFieldConstraints;
  displayOrder: number;
}

// Antd Form rules for a custom field's input, from its required flag and
// constraints.
export function buildCustomFieldRules(field: ItemField): Rule[] {
  const { label, required, constraints } = field;
  const rules: Rule[] = [{ required, message: `${label} is required` }];
  if (field.type === 'NUMBER') {
    if (constraints.min != null) {
      rules.push({
        type: 'number',
        min: constraints.min,
        message: `${label} must be at least ${constraints.min}`,
      });
    }
    if (constraints.max != null) {
      rules.push({
        type: 'number',
        max: constraints.max,
        message: `${label} must be at most ${constraints.max}`,
      });
    }
  }
  if (field.type === 'TEXT' && constraints.maxLength != null) {
    rules.push({
      max: constraints.maxLength,
      message: `${label} must be at most ${constraints.maxLength} characters`,
    });
  }
  // DATE and DATETIME use plain text inputs, so check their format here.
  // TIME uses a TimePicker, which can't produce a malformed value.
  if (field.type === 'DATE') {
    rules.push({ pattern: /^\d{4}-\d{2}-\d{2}$/, message: `${label} must be yyyy-MM-dd` });
  }
  if (field.type === 'DATETIME') {
    rules.push({
      pattern: LOCAL_DATETIME_PATTERN,
      message: `${label} must be yyyy-MM-dd HH:mm:ss`,
    });
  }
  return rules;
}
