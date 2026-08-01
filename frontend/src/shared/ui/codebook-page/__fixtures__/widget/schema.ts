import { z } from 'zod';

// Validation messages are i18n keys, matching entities/company/model/schema.ts.
export const widgetSchema = z.object({
  name: z.string().min(1, 'validation.required').max(60, 'validation.tooLong'),
  category: z.enum(['gadget', 'gizmo', 'doohickey']),
  quantity: z.number().int().min(0, 'validation.invalid'),
  active: z.boolean(),
});

export type WidgetFormValues = z.infer<typeof widgetSchema>;
