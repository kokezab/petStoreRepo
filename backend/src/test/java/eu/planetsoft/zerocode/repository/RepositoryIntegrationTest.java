package eu.planetsoft.zerocode.repository;

import static org.assertj.core.api.Assertions.assertThat;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import java.time.OffsetDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class RepositoryIntegrationTest extends PostgresIntegrationTest {

    @Autowired
    FieldDefinitionRepository fields;

    @Autowired
    ItemRepository items;

    @Test
    void persistsFieldDefinitionWithJsonbConstraints() {
        FieldDefinition def = new FieldDefinition();
        def.setFieldKey("qty");
        def.setLabel("Quantity");
        def.setType(FieldType.NUMBER);
        def.setRequired(true);
        def.setConstraints(Map.of("min", 0, "max", 100));
        def.setDisplayOrder(0);
        def.setCreatedAt(OffsetDateTime.now());

        FieldDefinition saved = fields.save(def);

        assertThat(saved.getId()).isNotNull();
        assertThat(fields.findByFieldKeyAndDeletedFalse("qty")).isPresent();
        assertThat(fields.findByDeletedFalseOrderByDisplayOrderAsc()).hasSize(1);
        assertThat(fields.countByDeletedFalse()).isEqualTo(1);
    }

    @Test
    void persistsItemWithJsonbCustomValues() {
        Item item = new Item();
        item.setName("Widget");
        item.setDescription("A widget");
        item.setCustomValues(Map.of("color", "red", "qty", 5));
        OffsetDateTime now = OffsetDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        Item saved = items.save(item);

        assertThat(saved.getId()).isNotNull();
        Item loaded = items.findById(saved.getId()).orElseThrow();
        assertThat(loaded.getCustomValues()).containsEntry("color", "red");
    }
}
