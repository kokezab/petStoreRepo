import type { Page, Route } from '@playwright/test';

import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';
import type { ItemPageResponse } from '@/shared/api/generated/zerocode/models/itemPageResponse';
import type { ItemResponse } from '@/shared/api/generated/zerocode/models/itemResponse';

import { inventoryCounts, type Order, type Pet, pets } from '../fixtures/pets';

const PET_BY_ID_PATTERN = /\/pet\/\d+(\?.*)?$/;

const ordersByPage = new WeakMap<Page, Order[]>();

export async function mockPetApi(page: Page): Promise<void> {
  const petsInMemory: Pet[] = [...pets];
  const ordersInMemory: Order[] = [];
  ordersByPage.set(page, ordersInMemory);

  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    const statuses = url.searchParams.getAll('status');
    const matched =
      statuses.length > 0
        ? petsInMemory.filter((pet) => pet.status !== undefined && statuses.includes(pet.status))
        : petsInMemory;
    await route.fulfill({ json: matched });
  });

  await page.route(PET_BY_ID_PATTERN, async (route: Route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const pet = petsInMemory.find((p) => p.id === id);
    if (!pet) {
      await route.fulfill({
        status: 404,
        json: { code: 404, type: 'error', message: 'Pet not found' },
      });
      return;
    }
    await route.fulfill({ json: pet });
  });

  await page.route('**/store/inventory', async (route: Route) => {
    await route.fulfill({ json: inventoryCounts });
  });

  await page.route('**/pet', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as {
      name: string;
      category?: { name: string };
      status: Pet['status'];
    };
    const newPet: Pet = {
      id: 6,
      name: body.name,
      status: body.status,
      category: { id: 99, name: body.category?.name ?? '' },
      photoUrls: [],
      tags: [],
    };
    petsInMemory.push(newPet);
    await route.fulfill({ json: newPet });
  });

  await page.route('**/store/order', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as Omit<Order, 'id'>;
    const newOrder: Order = { ...body, id: ordersInMemory.length + 1 };
    ordersInMemory.push(newOrder);
    await route.fulfill({ json: newOrder });
  });

  await page.route('**/user/createWithArray', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, json: {} });
  });

  await mockFeatureFlag(page, { 'pet-creation': false, 'order-creation': false });
}

export function getOrdersInMemory(page: Page): Order[] {
  return ordersByPage.get(page) ?? [];
}

export async function mockFeatureFlag(page: Page, flags: Record<string, boolean>): Promise<void> {
  await page.route('**/api/frontend**', async (route: Route) => {
    await route.fulfill({
      json: {
        toggles: Object.entries(flags).map(([name, enabled]) => ({
          name,
          enabled,
          variant: { name: 'disabled', enabled: false },
        })),
      },
    });
  });
}

export async function mockAddPetError(page: Page): Promise<void> {
  await page.route('**/pet', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      json: { code: 500, type: 'error', message: 'Internal server error' },
    });
  });
}

export async function mockCreateUsersError(page: Page): Promise<void> {
  await page.route('**/user/createWithArray', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      json: { code: 500, type: 'error', message: 'Internal server error' },
    });
  });
}

export async function mockAddOrderError(page: Page): Promise<void> {
  await page.route('**/store/order', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      json: { code: 500, type: 'error', message: 'Internal server error' },
    });
  });
}

export async function mockLoginError(page: Page): Promise<void> {
  await page.route('**/user/login**', async (route: Route) => {
    await route.fulfill({
      status: 400,
      json: { code: 400, type: 'error', message: 'Invalid username/password supplied' },
    });
  });
}

export async function mockPetListEmpty(page: Page, status: string): Promise<void> {
  // Registered after mockPetApi's route for the same URL, so Playwright runs this handler first;
  // route.fallback() hands non-matching statuses back to the earlier (baseline) handler.
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.getAll('status').includes(status)) {
      await route.fulfill({ json: [] });
    } else {
      await route.fallback();
    }
  });
}

export async function mockPetListError(page: Page): Promise<void> {
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    await route.fulfill({
      status: 500,
      json: { code: 500, type: 'error', message: 'Internal server error' },
    });
  });
}

export async function mockPetListDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route('**/pet/findByStatus**', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ json: pets.filter((pet) => pet.status === 'available') });
  });
}

export async function mockInventoryError(page: Page): Promise<void> {
  await page.route('**/store/inventory', async (route: Route) => {
    await route.fulfill({
      status: 500,
      json: { code: 500, type: 'error', message: 'Internal server error' },
    });
  });
}

export async function mockInventoryDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route('**/store/inventory', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ json: inventoryCounts });
  });
}

// Zero-Code field definitions. The handlers mirror the real backend's contract
// (see backend/.../FieldDefinitionService + GlobalExceptionHandler) closely
// enough that a page violating it fails here rather than only against the
// real API: `required` must always be sent (Jackson 3 rejects a missing
// primitive with a 400), the type is immutable (409), keys are never reused,
// and delete is a soft delete answered with 204.
const FIELDS_PATTERN = '**/api/fields';
const FIELD_BY_ID_PATTERN = '**/api/fields/*';

type MockField = FieldDefinitionResponse & { deleted: boolean };

const fieldsByPage = new WeakMap<Page, { fields: MockField[]; created: MockField[] }>();

function problem(status: number, title: string, detail: string) {
  return { status, json: { status, title, detail } };
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toResponse({ deleted: _deleted, ...field }: MockField): FieldDefinitionResponse {
  return field;
}

export async function mockFieldApi(page: Page, seed: FieldDefinitionResponse[]): Promise<void> {
  const fields: MockField[] = seed.map((field) => ({ ...field, deleted: false }));
  const created: MockField[] = [];
  fieldsByPage.set(page, { fields, created });

  const active = () =>
    fields
      .filter((field) => !field.deleted)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  await page.route(FIELDS_PATTERN, async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ json: active().map(toResponse) });
      return;
    }
    if (method !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as Partial<FieldDefinitionResponse>;
    if (!body.label?.trim() || !body.type || typeof body.required !== 'boolean') {
      await route.fulfill({ status: 400, json: { status: 400, error: 'Bad Request' } });
      return;
    }
    const base = slugify(body.label);
    if (!base) {
      await route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
      return;
    }
    let fieldKey = base;
    for (let suffix = 2; fields.some((field) => field.fieldKey === fieldKey); suffix++) {
      fieldKey = `${base}_${suffix}`;
    }
    const field: MockField = {
      id: `00000000-0000-0000-0000-${String(fields.length + 1).padStart(12, '0')}`,
      fieldKey,
      label: body.label,
      type: body.type,
      required: body.required,
      constraints: body.constraints ?? {},
      displayOrder: active().length,
      createdAt: new Date().toISOString(),
      deleted: false,
    };
    fields.push(field);
    created.push(field);
    await route.fulfill({ status: 201, json: toResponse(field) });
  });

  await page.route(FIELD_BY_ID_PATTERN, async (route: Route) => {
    const method = route.request().method();
    const id = new URL(route.request().url()).pathname.split('/').pop();
    const field = fields.find((f) => f.id === id && !f.deleted);
    if (method !== 'PATCH' && method !== 'DELETE') {
      await route.fallback();
      return;
    }
    if (!field) {
      await route.fulfill(problem(404, 'Not found', 'Field definition not found'));
      return;
    }
    if (method === 'DELETE') {
      field.deleted = true;
      await route.fulfill({ status: 204 });
      return;
    }
    const body = route.request().postDataJSON() as Partial<FieldDefinitionResponse>;
    if (!body.label?.trim() || typeof body.required !== 'boolean') {
      await route.fulfill({ status: 400, json: { status: 400, error: 'Bad Request' } });
      return;
    }
    if (body.type && body.type !== field.type) {
      await route.fulfill(
        problem(409, 'Field type is immutable', 'Field type is immutable once created'),
      );
      return;
    }
    field.label = body.label;
    field.required = body.required;
    if (body.constraints) field.constraints = body.constraints;
    if (body.displayOrder !== undefined) field.displayOrder = body.displayOrder;
    await route.fulfill({ json: toResponse(field) });
  });
}

export function getCreatedFields(page: Page): FieldDefinitionResponse[] {
  return (fieldsByPage.get(page)?.created ?? []).map(toResponse);
}

/** Active (non-deleted) mocked fields in display order — what `GET /api/fields` returns. */
export function getActiveMockFields(page: Page): FieldDefinitionResponse[] {
  return (fieldsByPage.get(page)?.fields ?? [])
    .filter((field) => !field.deleted)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(toResponse);
}

/** Adds a field to an already-mocked field API, last in display order. */
export function addMockField(
  page: Page,
  field: Pick<FieldDefinitionResponse, 'fieldKey' | 'label' | 'type' | 'required' | 'constraints'>,
): void {
  const state = fieldsByPage.get(page);
  if (!state) throw new Error('Call mockFieldApi before adding fields to it.');
  state.fields.push({
    ...field,
    id: `00000000-0000-0000-0000-${String(state.fields.length + 1).padStart(12, '0')}`,
    displayOrder: getActiveMockFields(page).length,
    createdAt: '2026-10-24T15:24:05.688011Z',
    deleted: false,
  });
}

export async function mockCreateFieldError(page: Page): Promise<void> {
  await page.route(FIELDS_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
  });
}

export async function mockUpdateFieldNotFound(page: Page): Promise<void> {
  await page.route(FIELD_BY_ID_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback();
      return;
    }
    await route.fulfill(problem(404, 'Not found', 'Field definition not found'));
  });
}

export async function mockDeleteFieldError(page: Page): Promise<void> {
  await page.route(FIELD_BY_ID_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
  });
}

// Zero-Code items. Mirrors backend/.../ItemService + FieldType.normalize, and
// validates `customValues` against the *mocked fields* (mockFieldApi must run
// first), so a page that breaks the contract fails here rather than only
// against the real API: blank name is a bare 400, invalid custom values are a
// 400 ProblemDetail with an `errors` map keyed by fieldKey (unknown keys,
// e.g. values of deleted fields, included), PUT is a full replace, and
// delete is a hard delete answered with 204.
// Regex, not a glob: the list GET carries page/sort query params.
const ITEMS_PATTERN = /\/api\/items(\?.*)?$/;
const ITEM_BY_ID_PATTERN = '**/api/items/*';

const itemsByPage = new WeakMap<Page, { items: ItemResponse[]; created: ItemResponse[] }>();

type ItemBody = { name?: string; description?: string; customValues?: Record<string, unknown> };

const ISO_OFFSET_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Returns the canonical value, or throws the backend's message for that field.
function normalizeCustomValue(field: FieldDefinitionResponse, raw: unknown): unknown {
  const constraints = (field.constraints ?? {}) as Record<string, number | undefined>;
  const asString = () => {
    if (typeof raw !== 'string') throw new Error('expected a string value');
    return raw;
  };
  switch (field.type) {
    case 'TEXT': {
      if (typeof raw !== 'string') throw new Error('expected a text value');
      const { maxLength } = constraints;
      if (maxLength != null && raw.length > maxLength) {
        throw new Error(`exceeds maxLength of ${maxLength}`);
      }
      return raw;
    }
    case 'NUMBER': {
      if (typeof raw !== 'number') throw new Error('expected a numeric value');
      const { min, max } = constraints;
      if (min != null && raw < min) throw new Error(`below min of ${min}`);
      if (max != null && raw > max) throw new Error(`above max of ${max}`);
      return raw;
    }
    case 'BOOLEAN':
      if (typeof raw !== 'boolean') throw new Error('expected a boolean value');
      return raw;
    case 'DATE': {
      const s = asString();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
        throw new Error('expected a date (yyyy-MM-dd)');
      }
      return s;
    }
    case 'TIME': {
      const s = asString();
      if (!/^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) throw new Error('expected a time (HH:mm:ss)');
      return s.length === 5 ? `${s}:00` : s.slice(0, 8);
    }
    case 'DATETIME': {
      const s = asString();
      if (!ISO_OFFSET_DATETIME.test(s)) throw new Error('expected an ISO-8601 offset date-time');
      return s;
    }
    default:
      return raw;
  }
}

function validateCustomValues(
  fields: FieldDefinitionResponse[],
  raw: Record<string, unknown> | undefined,
): { values: Record<string, unknown> } | { errors: Record<string, string> } {
  const input = raw ?? {};
  const errors: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (!fields.some((field) => field.fieldKey === key)) errors[key] = 'unknown field';
  }
  for (const field of fields) {
    const key = field.fieldKey ?? '';
    const value = input[key];
    if (value == null) {
      if (field.required) errors[key] = 'is required';
      continue;
    }
    try {
      values[key] = normalizeCustomValue(field, value);
    } catch (error) {
      errors[key] = (error as Error).message;
    }
  }
  return Object.keys(errors).length ? { errors } : { values };
}

function itemValidationProblem(errors: Record<string, string>) {
  return {
    status: 400,
    json: { status: 400, title: 'Validation failed', detail: 'Item validation failed', errors },
  };
}

const BAD_REQUEST = { status: 400, json: { status: 400, error: 'Bad Request' } };

// Mirrors ItemController.list: zero-based page, size capped at 100, ordered by
// createdAt (insertion order here) or name, with id as the tie-breaker.
function pageOfItems(items: ItemResponse[], query: URLSearchParams): ItemPageResponse {
  const page = Number(query.get('page') ?? 0);
  const size = Math.min(Number(query.get('size') ?? 20), 100);
  const sorted =
    query.get('sortBy') === 'name'
      ? [...items].sort(
          (a, b) =>
            (a.name ?? '').localeCompare(b.name ?? '') || (a.id ?? '').localeCompare(b.id ?? ''),
        )
      : [...items];
  if (query.get('direction') === 'desc') sorted.reverse();
  return { items: sorted.slice(page * size, (page + 1) * size), total: items.length, page, size };
}

export async function mockItemApi(page: Page, seed: ItemResponse[]): Promise<void> {
  const items: ItemResponse[] = seed.map((item) => ({ ...item }));
  const created: ItemResponse[] = [];
  itemsByPage.set(page, { items, created });

  // Validates a create/update body; answers the route and returns null on failure.
  const accept = async (route: Route, body: ItemBody) => {
    if (!body.name?.trim()) {
      await route.fulfill(BAD_REQUEST);
      return null;
    }
    const result = validateCustomValues(getActiveMockFields(page), body.customValues);
    if ('errors' in result) {
      await route.fulfill(itemValidationProblem(result.errors));
      return null;
    }
    return result.values;
  };

  await page.route(ITEMS_PATTERN, async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        json: pageOfItems(items, new URL(route.request().url()).searchParams),
      });
      return;
    }
    if (method !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as ItemBody;
    const customValues = await accept(route, body);
    if (!customValues) return;
    const now = new Date().toISOString();
    const item: ItemResponse = {
      id: `10000000-0000-0000-0000-${String(items.length + created.length + 1).padStart(12, '0')}`,
      name: body.name,
      description: body.description,
      customValues,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    created.push(item);
    await route.fulfill({ status: 201, json: item });
  });

  await page.route(ITEM_BY_ID_PATTERN, async (route: Route) => {
    const method = route.request().method();
    const id = new URL(route.request().url()).pathname.split('/').pop();
    const index = items.findIndex((item) => item.id === id);
    if (!['GET', 'PUT', 'DELETE'].includes(method)) {
      // The real backend has no PATCH for items.
      await route.fulfill({ status: 405, json: { status: 405, error: 'Method Not Allowed' } });
      return;
    }
    if (index === -1) {
      await route.fulfill(problem(404, 'Not found', 'Item not found'));
      return;
    }
    if (method === 'GET') {
      await route.fulfill({ json: items[index] });
      return;
    }
    if (method === 'DELETE') {
      items.splice(index, 1);
      await route.fulfill({ status: 204 });
      return;
    }
    // PUT is a full replace: whatever isn't sent is cleared.
    const body = route.request().postDataJSON() as ItemBody;
    const customValues = await accept(route, body);
    if (!customValues) return;
    items[index] = {
      ...items[index],
      name: body.name,
      description: body.description,
      customValues,
      updatedAt: new Date().toISOString(),
    };
    await route.fulfill({ json: items[index] });
  });
}

export function getCreatedItems(page: Page): ItemResponse[] {
  return itemsByPage.get(page)?.created ?? [];
}

/**
 * Stores a raw custom value on a mocked item, bypassing validation, to
 * simulate data left behind by a field that has since been deleted.
 */
export function setMockItemValue(page: Page, name: string, key: string, value: unknown): void {
  const item = itemsByPage.get(page)?.items.find((i) => i.name === name);
  if (!item) throw new Error(`No mocked item named "${name}". Call mockItemApi first.`);
  item.customValues = { ...item.customValues, [key]: value };
}

export async function mockCreateItemError(page: Page): Promise<void> {
  await page.route(ITEMS_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
  });
}

export async function mockCreateItemFieldErrors(
  page: Page,
  errors: Record<string, string>,
): Promise<void> {
  await page.route(ITEMS_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    await route.fulfill(itemValidationProblem(errors));
  });
}

export async function mockUpdateItemNotFound(page: Page): Promise<void> {
  await page.route(ITEM_BY_ID_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback();
      return;
    }
    await route.fulfill(problem(404, 'Not found', 'Item not found'));
  });
}

export async function mockDeleteItemError(page: Page): Promise<void> {
  await page.route(ITEM_BY_ID_PATTERN, async (route: Route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
  });
}
