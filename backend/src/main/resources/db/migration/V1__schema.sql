CREATE TABLE field_definition (
    id            uuid PRIMARY KEY,
    field_key     text        NOT NULL,
    label         text        NOT NULL,
    type          text        NOT NULL,
    required      boolean      NOT NULL DEFAULT false,
    constraints   jsonb        NOT NULL DEFAULT '{}'::jsonb,
    display_order integer      NOT NULL,
    deleted       boolean      NOT NULL DEFAULT false,
    created_at    timestamptz  NOT NULL
);

-- field_key unique only among active (non-deleted) definitions
CREATE UNIQUE INDEX ux_field_definition_active_key
    ON field_definition (field_key)
    WHERE deleted = false;

CREATE TABLE item (
    id            uuid PRIMARY KEY,
    name          text         NOT NULL,
    description   text,
    custom_values jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz  NOT NULL,
    updated_at    timestamptz  NOT NULL
);
