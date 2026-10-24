package eu.planetsoft.zerocode.service;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import eu.planetsoft.zerocode.repository.FieldDefinitionRepository;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FieldDefinitionService {

    private final FieldDefinitionRepository repository;

    public FieldDefinitionService(FieldDefinitionRepository repository) {
        this.repository = repository;
    }

    public List<FieldDefinition> list() {
        return repository.findByDeletedFalseOrderByDisplayOrderAsc();
    }

    @Transactional
    public FieldDefinition create(String label, FieldType type, boolean required,
                                  Map<String, Object> constraints) {
        FieldDefinition def = new FieldDefinition();
        def.setFieldKey(uniqueKey(FieldKeys.slugify(label)));
        def.setLabel(label);
        def.setType(type);
        def.setRequired(required);
        def.setConstraints(constraints == null ? new HashMap<>() : constraints);
        def.setDisplayOrder((int) repository.countByDeletedFalse());
        def.setCreatedAt(OffsetDateTime.now());
        return repository.save(def);
    }

    @Transactional
    public FieldDefinition update(UUID id, String label, FieldType type, boolean required,
                                  Map<String, Object> constraints, Integer displayOrder) {
        FieldDefinition def = repository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new NotFoundException("Field definition not found"));
        if (type != null && type != def.getType()) {
            throw new FieldTypeChangeException("Field type is immutable once created");
        }
        def.setLabel(label);
        def.setRequired(required);
        if (constraints != null) {
            def.setConstraints(constraints);
        }
        if (displayOrder != null) {
            def.setDisplayOrder(displayOrder);
        }
        return repository.save(def);
    }

    @Transactional
    public void softDelete(UUID id) {
        FieldDefinition def = repository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new NotFoundException("Field definition not found"));
        def.setDeleted(true);
        repository.save(def);
    }

    private String uniqueKey(String base) {
        String candidate = base;
        int suffix = 2;
        while (repository.findByFieldKeyAndDeletedFalse(candidate).isPresent()) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }
}
