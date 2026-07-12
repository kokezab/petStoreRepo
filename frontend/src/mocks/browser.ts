import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { getFindPetsByStatusMockHandler, getGetPetByIdResponseMock } from '@/api/generated/pet/pet.msw';

export const worker = setupWorker(
  getFindPetsByStatusMockHandler(),
  http.get('*/pet/:petId(\\d+)', () => HttpResponse.json(getGetPetByIdResponseMock())),
);
