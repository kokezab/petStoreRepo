package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.service.ItemService;
import eu.planetsoft.zerocode.web.dto.ItemDtos.CreateRequest;
import eu.planetsoft.zerocode.web.dto.ItemDtos.PageResponse;
import eu.planetsoft.zerocode.web.dto.ItemDtos.Response;
import eu.planetsoft.zerocode.web.dto.ItemDtos.SortDirection;
import eu.planetsoft.zerocode.web.dto.ItemDtos.SortField;
import eu.planetsoft.zerocode.web.dto.ItemDtos.UpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    static final int MAX_PAGE_SIZE = 100;

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(operationId = "listItems")
    public PageResponse list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            @RequestParam(defaultValue = "createdAt") SortField sortBy,
            @RequestParam(defaultValue = "asc") SortDirection direction) {
        int pageSize = Math.min(size, MAX_PAGE_SIZE);
        Sort.Direction dir = direction == SortDirection.desc ? Sort.Direction.DESC : Sort.Direction.ASC;
        Page<Item> result = service.list(page, pageSize, sortBy.name(), dir);
        return new PageResponse(
                result.getContent().stream().map(Response::from).toList(),
                result.getTotalElements(), page, pageSize);
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getItem")
    public Response get(@PathVariable UUID id) {
        return Response.from(service.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(operationId = "createItem")
    public Response create(@Valid @RequestBody CreateRequest req) {
        Item item = service.create(req.name(), req.description(), req.customValues());
        return Response.from(item);
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updateItem")
    public Response update(@PathVariable UUID id, @Valid @RequestBody UpdateRequest req) {
        Item item = service.update(id, req.name(), req.description(), req.customValues());
        return Response.from(item);
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteItem")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
