package eu.planetsoft.zerocode;

import static org.assertj.core.api.Assertions.assertThat;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.repository.FieldDefinitionRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class SeedDataTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    FieldDefinitionRepository fields;

    @Test
    void seedFieldsAreLoadedFromSeedMigration() {
        List<FieldDefinition> active = fields.findByDeletedFalseOrderByDisplayOrderAsc();
        assertThat(active).extracting(FieldDefinition::getFieldKey)
                .contains("color", "quantity");
    }
}
