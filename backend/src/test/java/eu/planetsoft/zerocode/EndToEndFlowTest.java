package eu.planetsoft.zerocode;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class EndToEndFlowTest extends PostgresIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void fieldLifecycleThenOrphanedValueIgnored() throws Exception {
        // create field
        String fieldBody = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Color","type":"TEXT","required":true,"constraints":{}}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Object fieldIdRaw = JsonPath.read(fieldBody, "$.id");
        String fieldId = String.valueOf(fieldIdRaw);

        // create item with that field
        String itemBody = mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{"color":"red"}}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Object itemIdRaw = JsonPath.read(itemBody, "$.id");
        String itemId = String.valueOf(itemIdRaw);

        // soft-delete the field
        mockMvc.perform(delete("/api/fields/" + fieldId)).andExpect(status().isNoContent());

        // the orphaned value is still physically stored on the item, but the field
        // is gone from the active definition list
        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.fieldKey=='color')]").isEmpty());
        mockMvc.perform(get("/api/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customValues.color").value("red"));
    }
}
