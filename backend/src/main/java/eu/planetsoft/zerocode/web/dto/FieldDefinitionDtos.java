package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class FieldDefinitionDtos {

    private FieldDefinitionDtos() {
    }

    @Schema(name = "FieldDefinitionCreateRequest")
    public record CreateRequest(
            @NotBlank String label,
            @NotNull FieldType type,
            boolean required,
            Map<String, Object> constraints) {
    }

    @Schema(name = "FieldDefinitionUpdateRequest")
    public record UpdateRequest(
            @NotBlank String label,
            FieldType type,
            boolean required,
            Map<String, Object> constraints,
            Integer displayOrder) {
    }

    @Schema(name = "FieldDefinitionResponse")
    public record Response(
            UUID id,
            String fieldKey,
            String label,
            FieldType type,
            boolean required,
            Map<String, Object> constraints,
            int displayOrder,
            OffsetDateTime createdAt) {

        public static Response from(FieldDefinition d) {
            return new Response(d.getId(), d.getFieldKey(), d.getLabel(), d.getType(),
                    d.isRequired(), d.getConstraints(), d.getDisplayOrder(), d.getCreatedAt());
        }
    }
}
