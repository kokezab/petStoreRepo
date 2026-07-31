import type { OpenAPIObject } from 'openapi3-ts/oas30';

/**
 * Orval input transformer: runs on the parsed OpenAPI document before code
 * generation.
 *
 * The Tracer backend currently exposes a security scheme whose component key
 * contains a space ("JWT Token"). OpenAPI requires component keys to match
 * /^[a-zA-Z0-9.\-_]+$/, so Orval (correctly) refuses to generate from it.
 *
 * Rather than block on a backend spec fix, we sanitize the document in-memory:
 *   1. Invalid securityScheme keys ("JWT Token") -> valid keys ("JWT_Token"),
 *      rewriting every reference in the `security` requirement arrays.
 *   2. Drop the `name` property from non-apiKey schemes — the Tracer "http"
 *      bearer scheme illegally carries `name`, which OpenAPI only allows on
 *      `apiKey` schemes.
 *
 * TODO(backend): rename the scheme to a valid key and remove the stray `name`
 * on the http bearer scheme, then delete this workaround.
 */
const VALID_KEY = /^[a-zA-Z0-9.\-_]+$/;

const sanitizeKey = (key: string): string => key.replace(/[^a-zA-Z0-9.\-_]+/g, '_');

export default (spec: OpenAPIObject): OpenAPIObject => {
  const schemes = spec.components?.securitySchemes;
  if (!schemes) return spec;

  const renames = new Map<string, string>();
  for (const key of Object.keys(schemes)) {
    if (!VALID_KEY.test(key)) renames.set(key, sanitizeKey(key));
  }

  // Rename the scheme definitions and strip properties that are illegal for
  // the scheme's type (`name` is only valid on apiKey schemes).
  const nextSchemes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schemes)) {
    let scheme = value as Record<string, unknown>;
    if (scheme && typeof scheme === 'object' && scheme.type !== 'apiKey' && 'name' in scheme) {
      scheme = { ...scheme };
      delete scheme.name;
    }
    nextSchemes[renames.get(key) ?? key] = scheme;
  }

  // Rewrite references inside a security requirement array.
  const remapSecurity = (
    security?: Array<Record<string, string[]>>,
  ): Array<Record<string, string[]>> | undefined =>
    security?.map((requirement) => {
      const next: Record<string, string[]> = {};
      for (const [key, scopes] of Object.entries(requirement)) {
        next[renames.get(key) ?? key] = scopes;
      }
      return next;
    });

  const nextPaths = spec.paths ?? {};
  for (const pathItem of Object.values(nextPaths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === 'object' && 'security' in operation) {
        (operation as { security?: Array<Record<string, string[]>> }).security = remapSecurity(
          (operation as { security?: Array<Record<string, string[]>> }).security,
        );
      }
    }
  }

  return {
    ...spec,
    security: remapSecurity(spec.security),
    components: { ...spec.components, securitySchemes: nextSchemes as never },
    paths: nextPaths,
  };
};
