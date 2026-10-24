INSERT INTO field_definition (id, field_key, label, type, required, constraints, display_order, deleted, created_at)
VALUES
  (gen_random_uuid(), 'color', 'Color', 'TEXT', false, '{"maxLength": 40}'::jsonb, 0, false, now()),
  (gen_random_uuid(), 'quantity', 'Quantity', 'NUMBER', true, '{"min": 0}'::jsonb, 1, false, now());

INSERT INTO item (id, name, description, custom_values, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Sample Widget', 'A seeded demo item',
   '{"color": "red", "quantity": 10}'::jsonb, now(), now()),
  (gen_random_uuid(), 'Sample Gadget', 'Another seeded item',
   '{"quantity": 3}'::jsonb, now(), now());
