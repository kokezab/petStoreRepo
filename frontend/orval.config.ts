import { defineConfig } from 'orval';

// Single source of truth for the Tracer backend spec. Points at the running
// backend's OpenAPI document. Generated output is committed, so CI never needs
// the backend up — only local `npm run generate:api` does.
const tracerInput = {
  target: 'http://localhost:8080/api/v3/api-docs',
  // The backend spec ships an invalid securityScheme key ("JWT Token" with a
  // space). Sanitize it in-memory so Orval can parse the document. See the
  // transformer for details / removal conditions.
  override: {
    transformer: './orval/sanitize-spec.ts',
  },
};

// Zero-Code Entity backend spec. Points at the running backend's OpenAPI
// document (springdoc default path, no `/api` prefix). No sanitizer needed —
// this backend declares no security schemes. Generated output is committed, so
// CI never needs the backend up — only local `npm run generate:api` does.
const zerocodeInput = {
  target: 'http://localhost:8090/v3/api-docs',
};

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
  // Primary backend (Tracer). Isolated from the petstore SDK in its own
  // `generated/tracer/` subtree so the two never clobber each other and the
  // demo petstore pages keep working unchanged. Uses the existing
  // `customInstance` mutator; point that instance at the Tracer base URL when
  // wiring these hooks up.
  tracer: {
    input: tracerInput,
    output: {
      target: './src/api/generated/tracer/endpoints.ts',
      schemas: './src/api/generated/tracer/models',
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
  // Runtime validators generated from the SAME Tracer spec as the SDK above, so
  // the zod schemas and TS types can never drift. Use ONLY at the API response
  // boundary (see CLAUDE.md) — not for Antd form validation.
  tracerZod: {
    input: tracerInput,
    output: {
      target: './src/api/generated/tracer/zod',
      client: 'zod',
      mode: 'tags-split',
      fileExtension: '.zod.ts',
    },
  },
  // Zero-Code Entity backend. Isolated in its own `generated/zerocode/` subtree
  // so it never clobbers the petstore/tracer SDKs. Uses the existing
  // `customInstance` mutator; point that instance at the zerocode base URL
  // (http://localhost:8090) when wiring these hooks up.
  zerocode: {
    input: zerocodeInput,
    output: {
      target: './src/api/generated/zerocode/endpoints.ts',
      schemas: './src/api/generated/zerocode/models',
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
  // Runtime validators generated from the SAME zerocode spec as the SDK above,
  // so the zod schemas and TS types can never drift. Use ONLY at the API
  // response boundary (see CLAUDE.md) — not for Antd form validation.
  zerocodeZod: {
    input: zerocodeInput,
    output: {
      target: './src/api/generated/zerocode/zod',
      client: 'zod',
      mode: 'tags-split',
      fileExtension: '.zod.ts',
    },
  },
});
