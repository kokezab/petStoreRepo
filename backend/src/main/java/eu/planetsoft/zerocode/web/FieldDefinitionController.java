package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.service.FieldDefinitionService;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.CreateRequest;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.Response;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.UpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fields")
public class FieldDefinitionController {

    private final FieldDefinitionService service;

    public FieldDefinitionController(FieldDefinitionService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(operationId = "listFields")
    public List<Response> list() {
        return service.list().stream().map(Response::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(operationId = "createField")
    public Response create(@Valid @RequestBody CreateRequest req) {
        FieldDefinition def = service.create(
                req.label(), req.type(), req.required(), req.constraints());
        return Response.from(def);
    }

    @PatchMapping("/{id}")
    @Operation(operationId = "updateField")
    public Response update(@PathVariable UUID id, @Valid @RequestBody UpdateRequest req) {
        FieldDefinition def = service.update(
                id, req.label(), req.type(), req.required(),
                req.constraints(), req.displayOrder());
        return Response.from(def);
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteField")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
