package eu.planetsoft.zerocode.service;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.repository.FieldDefinitionRepository;
import eu.planetsoft.zerocode.repository.ItemRepository;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository items;
    private final FieldDefinitionRepository fields;

    public ItemService(ItemRepository items, FieldDefinitionRepository fields) {
        this.items = items;
        this.fields = fields;
    }

    public List<Item> list() {
        return items.findAll();
    }

    public Item get(UUID id) {
        return items.findById(id)
                .orElseThrow(() -> new NotFoundException("Item not found"));
    }

    @Transactional
    public Item create(String name, String description, Map<String, Object> customValues) {
        Item item = new Item();
        item.setName(name);
        item.setDescription(description);
        item.setCustomValues(validateAndNormalize(customValues));
        OffsetDateTime now = OffsetDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);
        return items.save(item);
    }

    @Transactional
    public Item update(UUID id, String name, String description, Map<String, Object> customValues) {
        Item item = get(id);
        item.setName(name);
        item.setDescription(description);
        item.setCustomValues(validateAndNormalize(customValues));
        item.setUpdatedAt(OffsetDateTime.now());
        return items.save(item);
    }

    @Transactional
    public void delete(UUID id) {
        if (!items.existsById(id)) {
            throw new NotFoundException("Item not found");
        }
        items.deleteById(id);
    }

    Map<String, Object> validateAndNormalize(Map<String, Object> raw) {
        Map<String, Object> input = raw == null ? Map.of() : raw;
        List<FieldDefinition> active = fields.findByDeletedFalseOrderByDisplayOrderAsc();
        Map<String, String> errors = new LinkedHashMap<>();
        Map<String, Object> normalized = new HashMap<>();

        // unknown keys
        Map<String, FieldDefinition> byKey = new HashMap<>();
        active.forEach(d -> byKey.put(d.getFieldKey(), d));
        for (String key : input.keySet()) {
            if (!byKey.containsKey(key)) {
                errors.put(key, "unknown field");
            }
        }

        for (FieldDefinition def : active) {
            Object value = input.get(def.getFieldKey());
            if (value == null) {
                if (def.isRequired()) {
                    errors.put(def.getFieldKey(), "is required");
                }
                continue;
            }
            try {
                normalized.put(def.getFieldKey(),
                        def.getType().normalize(value, def.getConstraints()));
            } catch (FieldValidationException e) {
                errors.put(def.getFieldKey(), e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new ItemValidationException(errors);
        }
        return normalized;
    }
}
