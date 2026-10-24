# Zero-Code Entity Backend — Design

**Date:** 2026-10-23
**Status:** Approved (design)
**Author:** bkokeza

## Summary

A standalone **Spring Boot** REST backend that proves out a "zero-code" pattern: a
single built-in entity (`Item`) with fixed base fields, plus **custom fields defined
and managed at runtime** through the API. Custom-field values are stored in a Postgres
**JSONB** column; field definitions are stored as data and drive validation. The
deliverable is the backend + an OpenAPI/Swagger surface — no frontend work in this phase.

This is intentionally scoped as a proof of concept. It is designed so that extending it
later (more entity types, more field types, a UI) is additive rather than a rewrite, but
none of that is built now.

## Scope

**In scope**
- One built-in entity, `Item`, with fixed base fields: `id`, `name`, `description`,
  `createdAt`, `updatedAt`.
- Runtime-managed **custom field definitions** of types: `TEXT`, `NUMBER`, `BOOLEAN`,
  `DATE`, `TIME`, `DATETIME`.
- CRUD for item records, with custom-field values validated against active definitions.
- OpenAPI spec + Swagger UI.
- Flyway schema + a seed migration so the demo is immediately explorable.
- Unit + integration tests (Testcontainers Postgres).

**Explicitly out of scope (POC)**
- Multiple user-defined entity types (single `Item` only, but model shaped to grow).
- Enum/select field type.
- Authentication / authorization.
- `createdBy` / audit history.
- Per-field uniqueness constraints.
- Type-change migrations or hard deletes of field definitions.
- Any frontend; the existing React/orval app may generate a client off the OpenAPI spec
  as separate follow-up work.

## Stack

- **Java 25** (latest LTS).
- **Spring Boot 4.0.x** (current GA, 4.0.9 as of 2026-10-23; Spring Boot 3.5 reached OSS EOL on 2026-06-30, so 4.0 is now both the maintained and the mature choice).
- **Maven** build.
- **Spring Data JPA** over **PostgreSQL** (JSONB).
- **Flyway** for schema + seed migrations.
- **springdoc-openapi** for the OpenAPI spec and Swagger UI.
- **Testcontainers** for integration tests.
- Location: a new `backend/` folder, sibling to `frontend/` inside this repository.

## Data Model

Two tables. Base fields are real columns; custom-field values live in a single JSONB
column keyed by each definition's immutable `field_key`.

```
field_definition
  id            uuid        pk
  field_key     text        -- stable slug derived from label, immutable, unique among active
  label         text        not null
  type          text        not null  -- TEXT|NUMBER|BOOLEAN|DATE|TIME|DATETIME
  required      boolean      not null default false
  constraints   jsonb        not null default '{}'  -- type-specific (see below)
  display_order integer      not null  -- stable ordering for UI rendering/reordering
  deleted       boolean      not null default false  -- soft delete
  created_at    timestamptz  not null

item
  id            uuid         pk
  name          text         not null
  description   text
  custom_values jsonb        not null default '{}'  -- { "<field_key>": <typed value>, ... }
  created_at    timestamptz  not null
  updated_at    timestamptz  not null
```

**`field_key`** is derived once from the label (e.g. `"Unit Price"` → `unit_price`) and
is never changed. It is the key used inside `item.custom_values`. Immutability of
`field_key` + `type` is what makes the lifecycle rules below safe without any data
migration logic.

**`constraints`** JSONB shape by type:
- `TEXT` → `{ "maxLength": <int> }` (optional)
- `NUMBER` → `{ "min": <number>, "max": <number> }` (either/both optional)
- `BOOLEAN`, `DATE`, `TIME`, `DATETIME` → `{}`

**Value representation in `custom_values` JSONB:**
- `TEXT` → JSON string
- `NUMBER` → JSON number
- `BOOLEAN` → JSON boolean
- `DATE` → ISO-8601 string `yyyy-MM-dd`
- `TIME` → ISO-8601 string `HH:mm:ss`
- `DATETIME` → ISO-8601 string (full offset date-time)

## API Surface

All responses for validation failures use RFC 7807 `ProblemDetail` with per-field detail.

**Field definitions**
- `GET /api/fields` — list active definitions, ordered by `display_order`.
- `POST /api/fields` — create. Derives `field_key` from `label`, validates `type` and the
  shape of `constraints`, assigns `display_order`.
- `PATCH /api/fields/{id}` — edit `label`, `required`, `constraints`, `display_order`.
  Attempting to change `type` returns `409 Conflict`.
- `DELETE /api/fields/{id}` — soft-delete (`deleted = true`). Orphaned values in existing
  items are left in place and ignored by reads/validation.

**Items**
- `GET /api/items` — list with basic pagination (`page`, `size`).
- `GET /api/items/{id}` — fetch one.
- `POST /api/items` — create; `custom_values` validated against active definitions.
- `PUT /api/items/{id}` — full update; same validation; refreshes `updatedAt`.
- `DELETE /api/items/{id}` — hard delete of the record.

## Validation & Lifecycle Rules

On every item write (`POST` / `PUT`) the service loads active (non-deleted) field
definitions and validates `custom_values`:
- Unknown keys (not matching any active definition) are rejected.
- Every `required` field must be present and non-null.
- Each present value must match its definition's type; temporal values parsed as ISO-8601.
- Type constraints enforced: `maxLength` for `TEXT`; `min` / `max` for `NUMBER`.

Field-definition lifecycle ("safe & simple"):
- **Add** fields at any time.
- **Edit** `label`, `required`, `constraints`, `display_order` freely.
- **Type is immutable** once created → `409`.
- **Delete is soft**; orphaned JSONB values remain but are ignored.

## Layering

Standard layered structure, each layer with one clear responsibility:
- `web` — controllers + request/response DTOs; maps validation errors to `ProblemDetail`.
- `service` — item/field services: `field_key` derivation, custom-value validation,
  lifecycle-rule enforcement.
- `repository` — Spring Data JPA repositories.
- `domain` — JPA entities (`Item`, `FieldDefinition`) + the `FieldType` enum.
- `fieldtype` — a small strategy per field type encapsulating parse/validate/constraint
  logic, so adding a type later is an isolated, testable change.

## Infrastructure

- Add a dedicated `app-db` Postgres service (its own database) to the existing
  `docker-compose.yml`, kept separate from the Unleash database.
- Flyway migrations:
  - `V1__schema.sql` — the two tables + indexes (unique on active `field_key`).
  - `V2__seed.sql` — ~2 demo field definitions and a couple of items so Swagger UI is
    immediately explorable.

## Testing

- **Unit tests** — one per field-type strategy (parse/validate/constraint behavior) and
  for `field_key` derivation (slugification, collisions).
- **Integration tests** (`@SpringBootTest` + Testcontainers Postgres) covering the core
  flow: create field → create item with valid custom values (pass) and invalid ones
  (400) → soft-delete field → confirm orphaned value is ignored on subsequent reads.

## Future Extensions (not built now)

- Multiple user-defined entity types (the `field_definition` table would gain an
  `entity_type` discriminator).
- Enum/select and relation field types.
- Auth, audit (`createdBy`, change history), uniqueness constraints.
- React/orval client generated from the OpenAPI spec.
