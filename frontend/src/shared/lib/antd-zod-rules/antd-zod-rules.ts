import type { FormItemProps } from 'antd';
import type { z } from 'zod';

/**
 * Derives Antd Form `rules` from an Orval-generated zod schema.
 *
 * IMPORTANT (see CLAUDE.md): this does NOT make zod the form validator. Antd
 * Form still owns validation. We only read the constraint *metadata* baked into
 * the zod schema (which Orval generates from the OpenAPI spec) and translate it
 * into Antd's own native rule objects (`required`/`min`/`max`/`len`/`pattern`/
 * `type`). No zod `parse`/`safeParse` ever runs at validation time.
 *
 * The payoff: form limits (e.g. `name` max 100, `latitude` -90..90) stay in sync
 * with the backend contract automatically, with zero hand-written duplication.
 *
 *   const rules = antdRulesFromZod(CreateLocationBody);
 *   <Form.Item name='longitude' rules={rules.longitude} />
 */

type AntdRule = NonNullable<FormItemProps['rules']>[number];

// Minimal, defensive views over zod v4's internal representation. Zod does not
// expose a stable public introspection API, so this is the one place that reads
// `_zod.def`; it is deliberately isolated and tolerant of shape changes.
interface ZodCheckDef {
  check?: string;
  minimum?: number;
  maximum?: number;
  length?: number;
  value?: number;
  format?: string;
  pattern?: { source: string } | string;
}
interface ZodDef {
  type?: string;
  innerType?: unknown;
  checks?: unknown[];
  format?: string;
}

function getDef(schema: unknown): ZodDef | undefined {
  const holder = schema as { _zod?: { def?: ZodDef }; def?: ZodDef } | undefined;
  return holder?._zod?.def ?? holder?.def;
}

function getCheckDef(check: unknown): ZodCheckDef {
  const holder = check as { _zod?: { def?: ZodCheckDef }; def?: ZodCheckDef };
  return holder?._zod?.def ?? holder?.def ?? (check as ZodCheckDef);
}

/** Unwraps optional/nullable/default wrappers, tracking whether the field is optional. */
function unwrap(schema: unknown): { schema: unknown; optional: boolean } {
  let current = schema;
  let optional = false;
  let def = getDef(current);
  while (def && (def.type === 'optional' || def.type === 'nullable' || def.type === 'default')) {
    if (def.type === 'optional' || def.type === 'nullable') optional = true;
    current = def.innerType;
    def = getDef(current);
  }
  return { schema: current, optional };
}

function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fieldRules(field: unknown, label: string): AntdRule[] {
  const { schema, optional } = unwrap(field);
  const def = getDef(schema);
  const rules: AntdRule[] = [];

  if (!optional) {
    rules.push({ required: true, message: `${label} is required` });
  }
  if (!def) return rules;

  const isNumeric = def.type === 'number' || def.type === 'int' || def.type === 'bigint';
  const numericType = isNumeric ? ('number' as const) : ('string' as const);

  let min: number | undefined;
  let max: number | undefined;
  let len: number | undefined;

  for (const rawCheck of def.checks ?? []) {
    const c = getCheckDef(rawCheck);
    switch (c.check) {
      case 'min_length':
        if (c.minimum && c.minimum > 0) min = c.minimum;
        break;
      case 'max_length':
        max = c.maximum;
        break;
      case 'length':
        len = c.length;
        break;
      case 'greater_than':
      case 'greater_than_or_equal':
        min = c.value;
        break;
      case 'less_than':
      case 'less_than_or_equal':
        max = c.value;
        break;
      case 'string_format':
        if (c.format === 'email') {
          rules.push({ type: 'email', message: `${label} must be a valid email` });
        } else if (c.pattern) {
          const source = typeof c.pattern === 'string' ? c.pattern : c.pattern.source;
          rules.push({ pattern: new RegExp(source), message: `${label} has an invalid format` });
        }
        break;
    }
  }

  if (len !== undefined) {
    rules.push({ type: numericType, len, message: `${label} must be exactly ${len} characters` });
  }
  if (isNumeric && min !== undefined && max !== undefined) {
    rules.push({ type: 'number', min, max, message: `${label} must be between ${min} and ${max}` });
  } else {
    if (min !== undefined) {
      rules.push({
        type: numericType,
        min,
        message: isNumeric
          ? `${label} must be at least ${min}`
          : `${label} must be at least ${min} characters`,
      });
    }
    if (max !== undefined) {
      rules.push({
        type: numericType,
        max,
        message: isNumeric
          ? `${label} must be at most ${max}`
          : `${label} must be at most ${max} characters`,
      });
    }
  }

  return rules;
}

export interface AntdRulesFromZodOptions<Shape extends z.ZodRawShape> {
  /** Override the auto-humanized field label used in generated messages. */
  labels?: Partial<Record<keyof Shape, string>>;
}

export function antdRulesFromZod<Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
  options: AntdRulesFromZodOptions<Shape> = {},
): Record<keyof Shape, AntdRule[]> {
  const shape = schema.shape;
  const result = {} as Record<keyof Shape, AntdRule[]>;

  for (const key of Object.keys(shape) as (keyof Shape)[]) {
    const label = options.labels?.[key] ?? humanize(String(key));
    result[key] = fieldRules(shape[key], label);
  }

  return result;
}
