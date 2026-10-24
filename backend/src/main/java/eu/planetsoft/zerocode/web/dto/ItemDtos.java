package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.Item;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class ItemDtos {

    private ItemDtos() {
    }

    public record CreateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

    public record UpdateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

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
