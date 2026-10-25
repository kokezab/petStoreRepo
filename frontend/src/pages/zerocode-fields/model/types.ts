import { FieldDefinitionResponseType } from '@/api/generated/zerocode/models/fieldDefinitionResponseType';

export type FieldType = FieldDefinitionResponseType;

export const FIELD_TYPES: FieldType[] = Object.values(FieldDefinitionResponseType);

export interface FieldDefinition {
  id: string;
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface FieldFormValues {
  label: string;
  type: FieldType;
  required: boolean;
}
