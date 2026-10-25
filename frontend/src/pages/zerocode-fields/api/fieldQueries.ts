import { useQueryClient } from '@tanstack/react-query';

import {
  getList1QueryKey,
  useCreate1,
  useDelete1,
  useList1,
  useUpdate1,
} from '@/api/generated/zerocode/field-definition-controller/field-definition-controller';
import type { CreateRequest, UpdateRequest } from '@/api/generated/zerocode/models';
import type { FieldDefinitionCreateRequest } from '@/api/generated/zerocode/models/fieldDefinitionCreateRequest';
import type { FieldDefinitionResponse } from '@/api/generated/zerocode/models/fieldDefinitionResponse';
import type { FieldDefinitionUpdateRequest } from '@/api/generated/zerocode/models/fieldDefinitionUpdateRequest';
import { zerocodeRequest } from '@/shared/api';

import type { FieldDefinition } from '../model/types';
import { normalizeField } from './normalizeField';

// The generated field-definition controller is typed with the *item* models
// (Response / CreateRequest / UpdateRequest) even though the endpoints speak
// FieldDefinition* payloads. The casts below re-type the wire data at this
// boundary only; nothing outside this file sees a raw DTO.
// TODO(#19): drop the casts once the Zero-Code spec is fixed and the SDK regenerated

export const fieldQueryKeys = {
  list: getList1QueryKey,
};

const mutationMeta = { meta: { skipGlobalErrorToast: true } };

function byDisplayOrder(a: FieldDefinition, b: FieldDefinition) {
  return a.displayOrder - b.displayOrder;
}

export function useFields() {
  return useList1({
    request: zerocodeRequest,
    query: {
      queryKey: fieldQueryKeys.list(),
      select: (data) =>
        (data as unknown as FieldDefinitionResponse[]).map(normalizeField).sort(byDisplayOrder),
    },
  });
}

function useInvalidateFields() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: fieldQueryKeys.list() });
}

export function useCreateField() {
  const invalidate = useInvalidateFields();
  const mutation = useCreate1({ request: zerocodeRequest, mutation: mutationMeta });

  const createField = async (data: FieldDefinitionCreateRequest) => {
    await mutation.mutateAsync({ data: data as unknown as CreateRequest });
    await invalidate();
  };

  return { ...mutation, createField };
}

export function useUpdateField() {
  const invalidate = useInvalidateFields();
  const mutation = useUpdate1({ request: zerocodeRequest, mutation: mutationMeta });

  const updateField = async (id: string, data: FieldDefinitionUpdateRequest) => {
    await mutation.mutateAsync({ id, data: data as unknown as UpdateRequest });
    await invalidate();
  };

  return { ...mutation, updateField };
}

export function useDeleteField() {
  const invalidate = useInvalidateFields();
  const mutation = useDelete1({ request: zerocodeRequest, mutation: mutationMeta });

  const deleteField = async (id: string) => {
    await mutation.mutateAsync({ id });
    await invalidate();
  };

  return { ...mutation, deleteField };
}
