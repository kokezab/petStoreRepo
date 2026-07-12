import type { Page, Route } from '@playwright/test';

import { inventoryCounts, pets, type Pet } from '../fixtures/pets';

const PET_BY_ID_PATTERN = /\/pet\/\d+(\?.*)?$/;

export async function mockPetApi(page: Page): Promise<void> {
  const petsInMemory: Pet[] = [...pets];

  await page.route('**/pet/findByStatus**', async (route: Route) => {
    const url = new URL(route.request().url());
    const statuses = url.searchParams.getAll('status');
    const matched =
      statuses.length > 0 ? petsInMemory.filter((pet) => statuses.includes(pet.status)) : petsInMemory;
    await route.fulfill({ json: matched });
  });

  await page.route(PET_BY_ID_PATTERN, async (route: Route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const pet = petsInMemory.find((p) => p.id === id);
    if (!pet) {
      await route.fulfill({ status: 404, json: { code: 404, type: 'error', message: 'Pet not found' } });
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

  await mockFeatureFlag(page, { 'pet-creation': false });
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
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
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
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
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
    await route.fulfill({ status: 500, json: { code: 500, type: 'error', message: 'Internal server error' } });
  });
}

export async function mockInventoryDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route('**/store/inventory', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ json: inventoryCounts });
  });
}
