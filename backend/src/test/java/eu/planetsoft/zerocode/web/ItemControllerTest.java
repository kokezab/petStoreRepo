package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private void createItem(String name, int qty) throws Exception {
        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"customValues\":{\"qty\":" + qty + "}}"))
                .andExpect(status().isCreated());
    }

    @Test
    void listsItemsOnePageAtATimeOldestFirst() throws Exception {
        createItem("First", 1);
        createItem("Second", 2);
        createItem("Third", 3);

        mockMvc.perform(get("/api/items").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Third"));
    }

    @Test
    void listDefaultsToFirstPageOfTwenty() throws Exception {
        createItem("Only", 1);

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items[0].name").value("Only"));
    }

    @Test
    void sortsByNameInEitherDirection() throws Exception {
        createItem("Banana", 1);
        createItem("Apple", 2);
        createItem("Cherry", 3);

        mockMvc.perform(get("/api/items").param("sortBy", "name").param("direction", "desc"))
                .andExpect(jsonPath("$.items[0].name").value("Cherry"))
                .andExpect(jsonPath("$.items[2].name").value("Apple"));
        mockMvc.perform(get("/api/items").param("sortBy", "name").param("direction", "asc"))
                .andExpect(jsonPath("$.items[0].name").value("Apple"));
    }

    @Test
    void capsPageSizeAtOneHundred() throws Exception {
        mockMvc.perform(get("/api/items").param("size", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    void rejectsNegativePageAndUnknownSortField() throws Exception {
        mockMvc.perform(get("/api/items").param("page", "-1"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/items").param("sortBy", "customValues"))
                .andExpect(status().isBadRequest());
    }
}
