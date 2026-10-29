import { useMutation, useQueryClient } from '@tanstack/react-query';

import { zerocodeRequest } from '@/shared/api';
import {
  createField,
  deleteField,
  getGetFieldsQueryKey,
  updateField,
  useGetFields,
} from '@/shared/api/generated/zerocode/field-definition-controller/field-definition-controller';
import type { CreateRequest, UpdateRequest } from '@/shared/api/generated/zerocode/models';

import type { FieldDefinitionCreateRequest, FieldDefinitionUpdateRequest } from '../model/types';
import { normalizeFieldDefinition } from './normalizeFieldDefinition';

export const fieldDefinitionKeys = {
  all: getGetFieldsQueryKey,
};

export function useFieldDefinitions() {
  return useGetFields({
    request: zerocodeRequest,
    query: {
      select: (dtos) => dtos.map(normalizeFieldDefinition),
    },
  });
}

function useInvalidateFieldDefinitions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: fieldDefinitionKeys.all() });
}

export function useCreateFieldDefinition() {
  const invalidate = useInvalidateFieldDefinitions();
  return useMutation({
    mutationFn: (body: FieldDefinitionCreateRequest) =>
      createField(body as unknown as CreateRequest, zerocodeRequest),
    onSuccess: invalidate,
  });
}

export function useUpdateFieldDefinition() {
  const invalidate = useInvalidateFieldDefinitions();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FieldDefinitionUpdateRequest }) =>
      updateField(id, body as unknown as UpdateRequest, zerocodeRequest),
    onSuccess: invalidate,
  });
}

export function useDeleteFieldDefinition() {
  const invalidate = useInvalidateFieldDefinitions();
  return useMutation({
    mutationFn: (id: string) => deleteField(id, zerocodeRequest),
    onSuccess: invalidate,
  });
}
