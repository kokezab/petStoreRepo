package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.service.ItemService;
import eu.planetsoft.zerocode.web.dto.ItemDtos.CreateRequest;
import eu.planetsoft.zerocode.web.dto.ItemDtos.Response;
import eu.planetsoft.zerocode.web.dto.ItemDtos.UpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<Response> list() {
        return service.list().stream().map(Response::from).toList();
    }

    @GetMapping("/{id}")
    public Response get(@PathVariable UUID id) {
        return Response.from(service.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response create(@Valid @RequestBody CreateRequest req) {
        Item item = service.create(req.name(), req.description(), req.customValues());
        return Response.from(item);
    }

    @PutMapping("/{id}")
    public Response update(@PathVariable UUID id, @Valid @RequestBody UpdateRequest req) {
        Item item = service.update(id, req.name(), req.description(), req.customValues());
        return Response.from(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
