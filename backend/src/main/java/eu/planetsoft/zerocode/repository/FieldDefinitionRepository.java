package eu.planetsoft.zerocode.repository;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FieldDefinitionRepository extends JpaRepository<FieldDefinition, UUID> {

    List<FieldDefinition> findByDeletedFalseOrderByDisplayOrderAsc();

    Optional<FieldDefinition> findByFieldKeyAndDeletedFalse(String fieldKey);

    boolean existsByFieldKey(String fieldKey);

    long countByDeletedFalse();
}
