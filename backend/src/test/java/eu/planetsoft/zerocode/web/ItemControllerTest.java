package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@Transactional
class ItemControllerTest extends PostgresIntegrationTest {

    @Autowired MockMvc mockMvc;

    @BeforeEach
    void seedField() throws Exception {
        mockMvc.perform(post("/api/fields")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"label":"Qty","type":"NUMBER","required":true,"constraints":{"min":0}}"""));
    }

    @Test
    void createsItemWithValidCustomValue() throws Exception {
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","description":"d","customValues":{"qty":5}}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Widget"))
                .andExpect(jsonPath("$.customValues.qty").value(5));
    }

    @Test
    void rejectsMissingRequiredCustomValue() throws Exception {
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{}}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.qty").exists());
    }

    @Test
    void rejectsUnknownCustomKey() throws Exception {
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{"qty":1,"bogus":"x"}}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.bogus").exists());
    }

    @Test
    void rejectsValueViolatingConstraint() throws Exception {
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{"qty":-3}}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.qty").exists());
    }

    @Test
    void collectsMultipleErrorsInOneResponse() throws Exception {
        // missing required "qty" AND an unknown key "bogus" -> both reported
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{"bogus":"x"}}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.qty").exists())
                .andExpect(jsonPath("$.errors.bogus").exists());
    }
}
