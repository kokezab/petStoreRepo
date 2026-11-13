-- Back the paged item list: each supported sort order (see ItemDtos.SortField)
-- plus the id tie-breaker, so ORDER BY ... LIMIT reads an index instead of
-- sorting the whole table. Both directions use the same index (backward scan).
-- V3 rather than V2: V2 is the demo seed in db/seed.
CREATE INDEX ix_item_created_at_id ON item (created_at, id);
CREATE INDEX ix_item_name_id ON item (name, id);
