import type { Page, Route } from '@playwright/test';

import type { FieldDefinitionResponse } from '@/api/generated/zerocode/models/fieldDefinitionResponse';

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
