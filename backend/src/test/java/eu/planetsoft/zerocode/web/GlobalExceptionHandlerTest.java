package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import eu.planetsoft.zerocode.service.ItemValidationException;
import eu.planetsoft.zerocode.service.NotFoundException;
import eu.planetsoft.zerocode.service.FieldTypeChangeException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = GlobalExceptionHandlerTest.TestController.class)
@Import({GlobalExceptionHandlerTest.TestController.class, GlobalExceptionHandler.class})
class GlobalExceptionHandlerTest {

    @Autowired
    MockMvc mockMvc;

    @RestController
    static class TestController {
        @GetMapping("/boom/validation")
        String validation() {
            throw new ItemValidationException(Map.of("qty", "is required"));
        }

        @GetMapping("/boom/type")
        String type() {
            throw new FieldTypeChangeException("type is immutable");
        }

        @GetMapping("/boom/notfound")
        String notFound() {
            throw new NotFoundException("Item not found");
        }
    }

    @Test
    void validationBecomes400WithErrorsMap() throws Exception {
        mockMvc.perform(get("/boom/validation"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.qty").value("is required"));
    }

    @Test
    void typeChangeBecomes409() throws Exception {
        mockMvc.perform(get("/boom/type"))
                .andExpect(status().isConflict());
    }

    @Test
    void notFoundBecomes404() throws Exception {
        mockMvc.perform(get("/boom/notfound"))
                .andExpect(status().isNotFound());
    }
}
