import { z } from 'zod';

export const countrySchema = z.object({
  name: z.string().min(1, 'validation.required').max(100, 'validation.tooLong'),
  code: z.string().length(3, 'countries.validation.codeLength'),
});

export type CountryFormValues = z.infer<typeof countrySchema>;
