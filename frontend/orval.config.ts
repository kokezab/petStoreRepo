import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    input: {
      target: 'https://petstore.swagger.io/v2/swagger.json',
    },
    output: {
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
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
