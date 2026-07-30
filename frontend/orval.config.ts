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
  // Runtime validators generated from the SAME spec as the SDK above. Because
  // they come from the OpenAPI constraints (maxLength / pattern / minimum /
  // ...), the zod schemas and the TS types can never drift. Use these ONLY at
  // the API response boundary (see CLAUDE.md) — not for Antd form validation.
  // (Antd Form still owns form validation; `antdRulesFromZod` only reads the
  // constraint metadata off these schemas.)
  petstoreZod: {
    input: {
      target: 'https://petstore.swagger.io/v2/swagger.json',
    },
    output: {
      target: './src/api/generated/zod',
      client: 'zod',
      mode: 'tags-split',
      fileExtension: '.zod.ts',
    },
  },
});
