import { z } from 'zod';

// Mirrors the server contract (CompanyInsertCommand / CompanyUpdateCommand):
//   name        required, max 100
//   shortName   required, max 30
//   additionalInfo optional, max 1000
export const companySchema = z.object({
  name: z.string().min(1, 'validation.required').max(100, 'validation.tooLong'),
  shortName: z.string().min(1, 'validation.required').max(30, 'validation.tooLong'),
  additionalInfo: z.string().max(1000, 'validation.tooLong').optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
