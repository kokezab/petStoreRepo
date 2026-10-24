package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@Transactional
class FieldDefinitionControllerTest extends PostgresIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void createDerivesFieldKeyAndListsIt() throws Exception {
        mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Unit Price","type":"NUMBER","required":true,
                             "constraints":{"min":0}}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fieldKey").value("unit_price"))
                .andExpect(jsonPath("$.type").value("NUMBER"));

        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.fieldKey=='unit_price')]").isNotEmpty());
    }

    @Test
    void patchingTypeReturns409() throws Exception {
        String body = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Color","type":"TEXT","required":false,"constraints":{}}"""))
                .andReturn().getResponse().getContentAsString();
        Object idRaw = JsonPath.read(body, "$.id");
        String id = String.valueOf(idRaw);

        mockMvc.perform(patch("/api/fields/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Color","type":"NUMBER","required":false,"constraints":{}}"""))
                .andExpect(status().isConflict());
    }

    @Test
    void softDeleteRemovesFromActiveList() throws Exception {
        String body = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Notes","type":"TEXT","required":false,"constraints":{}}"""))
                .andReturn().getResponse().getContentAsString();
        Object idRaw = JsonPath.read(body, "$.id");
        String id = String.valueOf(idRaw);

        mockMvc.perform(delete("/api/fields/" + id)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.fieldKey=='notes')]").isEmpty());
    }

    @Test
    void recreatingASoftDeletedLabelDoesNotReuseItsKey() throws Exception {
        String body = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Palette","type":"TEXT","required":false,"constraints":{}}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fieldKey").value("palette"))
                .andReturn().getResponse().getContentAsString();
        Object idRaw = JsonPath.read(body, "$.id");
        String id = String.valueOf(idRaw);

        mockMvc.perform(delete("/api/fields/" + id)).andExpect(status().isNoContent());

        mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Palette","type":"NUMBER","required":false,"constraints":{}}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fieldKey").value("palette_2"));
    }

    @Test
    void rejectsMalformedConstraintAtCreation() throws Exception {
        mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Size","type":"TEXT","required":false,"constraints":{"maxLength":"abc"}}"""))
                .andExpect(status().isBadRequest());
    }
}
