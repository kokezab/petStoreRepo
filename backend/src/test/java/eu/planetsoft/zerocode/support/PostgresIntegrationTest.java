package eu.planetsoft.zerocode.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
public abstract class PostgresIntegrationTest {

    // Singleton container pattern: intentionally NOT managed by the
    // @Testcontainers JUnit extension (no @Container/@Testcontainers here).
    // That extension stops a static container after every test class that
    // declares it, which breaks reuse of the SAME container (and any cached
    // Spring ApplicationContext bound to it) across the multiple test classes
    // that extend this base. Starting it once, manually, and never stopping
    // it (Testcontainers' Ryuk reaper cleans it up on JVM exit) keeps it alive
    // for the whole test run.
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void overrideValidation(DynamicPropertyRegistry registry) {
        // Flyway owns the schema; keep validate.
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        // Keep the shared integration-test database seed-free: the demo seed
        // migration (classpath:db/seed) lives outside the schema location and
        // must not be applied here, since the committed seed rows would leak
        // across the singleton Testcontainers container into every test class
        // that extends this base.
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }
}
