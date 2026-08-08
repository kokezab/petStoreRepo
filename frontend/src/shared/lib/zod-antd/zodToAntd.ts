import type { Rule } from 'antd/es/form';
import type { ParseKeys } from 'i18next';
import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

import { useLocalization } from '@/shared/lib/i18n';

/**
 * Returns a `zodToAntd(schema, field)` function bound to the current `t`.
 * Zod messages are expected to be translation KEYS (e.g. 'validation.required'),
 * not literal English strings — see entities/country/model/schema.ts.
 */
export function useZodToAntd() {
  const { t } = useLocalization();

  return function zodToAntd(schema: ZodObject<ZodRawShape>, field: string): Rule[] {
    const shape = schema.shape[field] as ZodTypeAny | undefined;
    if (!shape) return [];

    const isOptional = typeof shape.isOptional === 'function' ? shape.isOptional() : false;

    return [
      {
        required: !isOptional,
        validator: async (_rule, value) => {
          // Handle "empty" before delegating to zod. An empty required field
          // arrives as undefined, which fails zod's TYPE check first — surfacing
          // the raw "expected string, received undefined" instead of the field's
          // own `.min(1, ...)` message (refinements only run once the type is
          // satisfied). Map it to our required key; let optional-empty pass.
          const isEmpty = value === undefined || value === null || value === '';
          if (isEmpty) {
            if (!isOptional) throw new Error(t('validation.required'));
            return;
          }

          const result = shape.safeParse(value);
          if (!result.success) {
            // Zod's `.message` is always `string`; by convention (see file comment)
            // schema authors put a translation key there, so we assert it here rather
            // than widening `t`'s type everywhere else.
            const messageKey = (result.error.issues[0]?.message ??
              'validation.invalid') as ParseKeys<'translation'>;
            throw new Error(t(messageKey));
          }
        },
      },
    ];
  };
}
