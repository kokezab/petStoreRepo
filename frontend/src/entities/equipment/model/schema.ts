import { z } from 'zod';

export const equipmentSchema = z.object({
  name: z.string().min(1, 'validation.required').max(100, 'validation.tooLong'),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;
