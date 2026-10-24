package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.Item;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class ItemDtos {

    private ItemDtos() {
    }

    @Schema(name = "ItemCreateRequest")
    public record CreateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

    @Schema(name = "ItemUpdateRequest")
    public record UpdateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

    @Schema(name = "ItemResponse")
    public record Response(
            UUID id,
            String name,
            String description,
            Map<String, Object> customValues,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        public static Response from(Item i) {
            return new Response(i.getId(), i.getName(), i.getDescription(),
                    i.getCustomValues(), i.getCreatedAt(), i.getUpdatedAt());
        }
    }
}
