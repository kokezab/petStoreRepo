package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.Item;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.List;
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

    // One page of items. `page` is zero-based; `total` counts all items.
    @Schema(name = "ItemPageResponse")
    public record PageResponse(
            List<Response> items,
            long total,
            int page,
            int size) {
    }

    // Values are the Item properties the list can be ordered by; each has an index.
    @Schema(name = "ItemSortField")
    public enum SortField { createdAt, name }

    @Schema(name = "ItemSortDirection")
    public enum SortDirection { asc, desc }
}
