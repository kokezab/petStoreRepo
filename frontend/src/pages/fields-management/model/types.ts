import type { FieldDefinitionCreateRequest } from '@/shared/api/generated/zerocode/models/fieldDefinitionCreateRequest';
import { FieldDefinitionResponseType } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponseType';
import type { FieldDefinitionUpdateRequest } from '@/shared/api/generated/zerocode/models/fieldDefinitionUpdateRequest';

export type { FieldDefinitionCreateRequest, FieldDefinitionUpdateRequest };

export type FieldType = FieldDefinitionResponseType;

export const FIELD_TYPES: FieldType[] = Object.values(FieldDefinitionResponseType);

export interface FieldDefinition {
  id: string;
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  constraints: Record<string, unknown>;
  displayOrder: number;
  createdAt?: string;
}
