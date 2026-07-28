import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    input: {
      target: 'https://petstore.swagger.io/v2/swagger.json',
      // Enablement demo - contract drift: swap to the line below, run
      // `npm run generate:api`, then `npx tsc -b`. The spec renames Pet.name to
      // Pet.petName, and the compiler names every line that just broke.
      // target: './demo/petstore-drifted.json',
    },
    output: {
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: true,
      mode: 'tags-split',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
