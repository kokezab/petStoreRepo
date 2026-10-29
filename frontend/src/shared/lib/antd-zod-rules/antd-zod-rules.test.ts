import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { antdRulesFromZod } from './antd-zod-rules';

const schema = z.object({
  name: z.string().min(0).max(100),
  shortName: z.string().max(30).optional(),
  code: z.int().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]+$/)
    .optional(),
  locationType: z.enum(['A', 'B']).optional(),
});

describe('antdRulesFromZod', () => {
  const rules = antdRulesFromZod(schema, { labels: { shortName: 'Short name' } });

  it('marks a non-optional field as required', () => {
    expect(rules.name).toContainEqual({ required: true, message: 'Name is required' });
  });

  it('does not mark an optional field as required', () => {
    expect(rules.shortName.some((r) => 'required' in r && r.required)).toBe(false);
  });

  it('derives a string max-length rule with the max from the schema', () => {
    expect(rules.name).toContainEqual({
      type: 'string',
      max: 100,
      message: 'Name must be at most 100 characters',
    });
  });

  it('uses the provided label override in messages', () => {
    expect(rules.shortName).toContainEqual({
      type: 'string',
      max: 30,
      message: 'Short name must be at most 30 characters',
    });
  });

  it('collapses a numeric min+max into a single between rule', () => {
    expect(rules.latitude).toContainEqual({
      type: 'number',
      min: -90,
      max: 90,
      message: 'Latitude must be between -90 and 90',
    });
  });

  it('derives a numeric min rule', () => {
    expect(rules.code).toContainEqual({
      type: 'number',
      min: 1,
      message: 'Code must be at least 1',
    });
  });

  it('derives a pattern rule from a string regex', () => {
    const pattern = rules.phone.find((r) => 'pattern' in r);
    expect(pattern).toBeDefined();
    expect((pattern as { pattern: RegExp }).pattern.source).toBe('^\\+?[0-9]+$');
  });

  it('emits only a bare (empty) rule set for an optional enum handled by the Select', () => {
    expect(rules.locationType).toEqual([]);
  });
});
