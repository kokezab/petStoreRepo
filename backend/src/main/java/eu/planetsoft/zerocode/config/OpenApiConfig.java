package eu.planetsoft.zerocode.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI zeroCodeOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Zero-Code Entity API")
                .version("v1")
                .description("Manage an Item entity and its runtime-defined custom fields."));
    }
}
