import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

import {
  getFindPetsByStatusMockHandler,
  getGetPetByIdResponseMock,
} from '@/api/generated/pet/pet.msw';

export const worker = setupWorker(
  getFindPetsByStatusMockHandler(),
  http.get('*/pet/:petId(\\d+)', () => HttpResponse.json(getGetPetByIdResponseMock())),
);

// --- Enablement-demo failure handlers -------------------------------------
// Uncomment one at a time to show how the two error classes are routed
// differently by src/lib/query-client.ts. Put them FIRST in setupWorker above
// (or worker.use(...) from the console) so they win over the generated handler.
//
// 5xx: boundary-worthy. One retry after 300ms, then RouteErrorBoundary renders
// a fallback - no toast, because a fallback UI is already showing.
// export const listServerError = http.get('*/pet/findByStatus', () =>
//   HttpResponse.json({ message: 'Kennel on fire' }, { status: 500 }),
// );
//
// 4xx: stays local. useCreatePet opts out of the global toast via
// meta.skipGlobalErrorToast, so this renders inline inside the modal.
// export const addPetRejected = http.post('*/pet', () =>
//   HttpResponse.json({ message: 'Pet name already taken' }, { status: 400 }),
// );
