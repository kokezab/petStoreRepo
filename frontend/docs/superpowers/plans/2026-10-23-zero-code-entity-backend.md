# Zero-Code Entity Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spring Boot REST backend where a single built-in `Item` entity has fixed base fields plus custom fields that are defined and managed at runtime, with values stored in a Postgres JSONB column and validated against field definitions.

**Architecture:** Layered Spring Boot app (`web` → `service` → `repository` → `domain`), Postgres via Spring Data JPA/Hibernate 7. Custom-field *definitions* are rows in `field_definition`; custom-field *values* live in an `item.custom_values` JSONB column keyed by each definition's immutable `field_key`. A `FieldType` enum encapsulates per-type parse/validate/constraint logic. Schema and seed data are managed by Flyway. OpenAPI/Swagger via springdoc.

**Tech Stack:** Java 25, Spring Boot 4.0.x, Maven, Spring Data JPA, Hibernate 7 (`@JdbcTypeCode(SqlTypes.JSON)` for JSONB), Flyway, springdoc-openapi 3.x, Testcontainers + JUnit 5 for integration tests.

## Global Constraints

- **Java version:** 25.
- **Spring Boot version:** 4.0.x (use current latest 4.0 patch, e.g. `4.0.9`). Do NOT use 3.5.x — it is OSS-EOL as of 2026-06-30.
- **springdoc-openapi:** `springdoc-openapi-starter-webmvc-ui` version `3.1.1` (the 3.x line is the Spring Boot 4 line).
- **Base package:** `eu.planetsoft.zerocode`.
- **Module location:** `backend/` folder at the git root (sibling to `frontend/`). The git root is `it-frontend-repo/`; `docker-compose.yml` is there. All git commands run from the git root.
- **Field types supported:** `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `TIME`, `DATETIME`.
- **Field lifecycle:** add anytime; edit `label`/`required`/`constraints`/`display_order`; `type` is immutable (409 on change attempt); delete is soft (`deleted=true`), orphaned JSONB values left untouched and ignored.
- **Temporal JSON formats:** `DATE` = `yyyy-MM-dd`, `TIME` = `HH:mm:ss`, `DATETIME` = ISO-8601 offset date-time.
- **Error responses:** RFC 7807 `ProblemDetail`; validation failures are `400` with a per-field `errors` map; field type-change attempt is `409`.
- **Commits:** The repo owner's standing preference is *no auto-commit/push*. The commit step in each task is part of the TDD cadence — **run it only after the owner approves that task's changes**, or treat it as a checkpoint the owner performs. Never push.
- **DB ownership:** Flyway owns the schema; JPA runs with `ddl-auto: validate`.

---

## File Structure

```
it-frontend-repo/
  docker-compose.yml                 # MODIFY: add `app-db` postgres service
  backend/
    pom.xml                          # Maven, Spring Boot 4.0 parent
    src/main/
      java/eu/planetsoft/zerocode/
        ZeroCodeApplication.java     # @SpringBootApplication
        domain/
          FieldType.java             # enum + per-type normalize() logic
          FieldDefinition.java       # @Entity
          Item.java                  # @Entity
        repository/
          FieldDefinitionRepository.java
          ItemRepository.java
        service/
          FieldKeys.java             # static slugify()
          FieldValidationException.java
          ItemValidationException.java
          FieldDefinitionService.java
          ItemService.java
        web/
          GlobalExceptionHandler.java
          dto/
            FieldDefinitionDtos.java # Create/Update/Response records
            ItemDtos.java            # Create/Update/Response records
          FieldDefinitionController.java
          ItemController.java
        config/
          OpenApiConfig.java
      resources/
        application.yml
        db/migration/
          V1__schema.sql
          V2__seed.sql
    src/test/
      java/eu/planetsoft/zerocode/
        domain/FieldTypeTest.java
        service/FieldKeysTest.java
        support/PostgresIntegrationTest.java   # abstract base w/ Testcontainers
        repository/RepositoryIntegrationTest.java
        web/GlobalExceptionHandlerTest.java
        web/FieldDefinitionControllerTest.java
        web/ItemControllerTest.java
        EndToEndFlowTest.java
      resources/
        application-test.yml (optional; Testcontainers via @ServiceConnection)
```

---

### Task 1: Project scaffold, Postgres service, boot smoke test

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/ZeroCodeApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/db/migration/V1__schema.sql` (minimal, expanded in Task 4)
- Create: `backend/src/test/java/eu/planetsoft/zerocode/support/PostgresIntegrationTest.java`
- Create: `backend/src/test/java/eu/planetsoft/zerocode/SmokeTest.java`
- Modify: `docker-compose.yml` (add `app-db` service)

**Interfaces:**
- Produces: `PostgresIntegrationTest` — abstract `@SpringBootTest` base that boots against a Testcontainers Postgres via `@ServiceConnection`. Later integration tests extend it.

- [ ] **Step 1: Create `backend/pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.9</version>
        <relativePath/>
    </parent>

    <groupId>eu.planetsoft</groupId>
    <artifactId>zerocode-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>zerocode-backend</name>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>3.1.1</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Create the application entry point**

`backend/src/main/java/eu/planetsoft/zerocode/ZeroCodeApplication.java`:

```java
package eu.planetsoft.zerocode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ZeroCodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZeroCodeApplication.class, args);
    }
}
```

- [ ] **Step 3: Create `application.yml`**

`backend/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: zerocode-backend
  datasource:
    url: jdbc:postgresql://localhost:5433/zerocode
    username: zerocode
    password: zerocode
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate.format_sql: true
  flyway:
    enabled: true

springdoc:
  swagger-ui:
    path: /swagger-ui.html

server:
  port: 8080
```

- [ ] **Step 4: Create a minimal `V1__schema.sql` (expanded in Task 4)**

`backend/src/main/resources/db/migration/V1__schema.sql`:

```sql
-- Placeholder so Flyway validates on first boot; full schema added in Task 4.
CREATE TABLE IF NOT EXISTS flyway_bootstrap_marker (
    id integer PRIMARY KEY
);
```

- [ ] **Step 5: Add the `app-db` Postgres service to `docker-compose.yml`**

Append this service under `services:` in `docker-compose.yml` (keep the existing `postgres`/`unleash` services untouched), and add the volume under `volumes:`:

```yaml
  app-db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: zerocode
      POSTGRES_PASSWORD: zerocode
      POSTGRES_DB: zerocode
    ports:
      - "5433:5432"
    volumes:
      - app_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zerocode -d zerocode"]
      interval: 5s
      timeout: 5s
      retries: 10
```

Add to the `volumes:` block:

```yaml
  app_db_data:
```

- [ ] **Step 6: Create the Testcontainers integration base class**

`backend/src/test/java/eu/planetsoft/zerocode/support/PostgresIntegrationTest.java`:

```java
package eu.planetsoft.zerocode.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
public abstract class PostgresIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void overrideValidation(DynamicPropertyRegistry registry) {
        // Flyway owns the schema; keep validate.
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
}
```

- [ ] **Step 7: Write the smoke test**

`backend/src/test/java/eu/planetsoft/zerocode/SmokeTest.java`:

```java
package eu.planetsoft.zerocode;

import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;

class SmokeTest extends PostgresIntegrationTest {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 8: Run the smoke test to verify the context boots against Postgres**

Run (from `backend/`): `mvn -q test -Dtest=SmokeTest`
Expected: BUILD SUCCESS; Testcontainers starts a Postgres, Flyway applies `V1`, context loads.

- [ ] **Step 9: Commit** (per Global Constraints — only after owner approval)

```bash
git add backend/pom.xml backend/src/main/java backend/src/main/resources backend/src/test/java docker-compose.yml
git commit -m "chore(backend): scaffold Spring Boot 4 app with Postgres + Testcontainers smoke test"
```

---

### Task 2: `FieldKeys.slugify` utility

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/service/FieldKeys.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/service/FieldKeysTest.java`

**Interfaces:**
- Produces: `FieldKeys.slugify(String label) -> String` — lowercases, replaces each run of non-alphanumeric chars with a single `_`, strips leading/trailing `_`. Throws `IllegalArgumentException` if the result is empty.

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/eu/planetsoft/zerocode/service/FieldKeysTest.java`:

```java
package eu.planetsoft.zerocode.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class FieldKeysTest {

    @Test
    void lowercasesAndUnderscoresSpaces() {
        assertThat(FieldKeys.slugify("Unit Price")).isEqualTo("unit_price");
    }

    @Test
    void collapsesPunctuationRuns() {
        assertThat(FieldKeys.slugify("Price (USD)")).isEqualTo("price_usd");
    }

    @Test
    void stripsLeadingAndTrailingSeparators() {
        assertThat(FieldKeys.slugify("  --Color--  ")).isEqualTo("color");
    }

    @Test
    void rejectsLabelWithNoAlphanumerics() {
        assertThatThrownBy(() -> FieldKeys.slugify("---"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=FieldKeysTest`
Expected: FAIL — `FieldKeys` does not exist / cannot resolve symbol.

- [ ] **Step 3: Write the implementation**

`backend/src/main/java/eu/planetsoft/zerocode/service/FieldKeys.java`:

```java
package eu.planetsoft.zerocode.service;

public final class FieldKeys {

    private FieldKeys() {
    }

    public static String slugify(String label) {
        if (label == null) {
            throw new IllegalArgumentException("label must not be null");
        }
        String key = label.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (key.isEmpty()) {
            throw new IllegalArgumentException(
                    "label '" + label + "' produces an empty field key");
        }
        return key;
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=FieldKeysTest`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/service/FieldKeys.java backend/src/test/java/eu/planetsoft/zerocode/service/FieldKeysTest.java
git commit -m "feat(backend): add field-key slugify utility"
```

---

### Task 3: `FieldType` enum with per-type validation/normalization

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/domain/FieldType.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/service/FieldValidationException.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/domain/FieldTypeTest.java`

**Interfaces:**
- Produces:
  - `enum FieldType { TEXT, NUMBER, BOOLEAN, DATE, TIME, DATETIME }`
  - `FieldType.normalize(Object raw, Map<String,Object> constraints) -> Object` — validates `raw` against the type and constraints, returns the canonical JSON-storable value (`String` for TEXT/DATE/TIME/DATETIME, `BigDecimal`→stored as number for NUMBER, `Boolean` for BOOLEAN). Throws `FieldValidationException` with a human message on any violation.
  - `FieldValidationException extends RuntimeException` with `getMessage()`.
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/eu/planetsoft/zerocode/domain/FieldTypeTest.java`:

```java
package eu.planetsoft.zerocode.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import eu.planetsoft.zerocode.service.FieldValidationException;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FieldTypeTest {

    @Test
    void textAcceptsStringAndEnforcesMaxLength() {
        assertThat(FieldType.TEXT.normalize("hello", Map.of())).isEqualTo("hello");
        assertThat(FieldType.TEXT.normalize("hi", Map.of("maxLength", 5))).isEqualTo("hi");
        assertThatThrownBy(() -> FieldType.TEXT.normalize("toolong", Map.of("maxLength", 3)))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("maxLength");
    }

    @Test
    void textRejectsNonString() {
        assertThatThrownBy(() -> FieldType.TEXT.normalize(42, Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void numberAcceptsNumericAndEnforcesMinMax() {
        assertThat(FieldType.NUMBER.normalize(5, Map.of())).isEqualTo(new BigDecimal("5"));
        assertThat(FieldType.NUMBER.normalize(2.5, Map.of("min", 0, "max", 10)))
                .isEqualTo(new BigDecimal("2.5"));
        assertThatThrownBy(() -> FieldType.NUMBER.normalize(20, Map.of("max", 10)))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("max");
        assertThatThrownBy(() -> FieldType.NUMBER.normalize(-1, Map.of("min", 0)))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("min");
    }

    @Test
    void numberRejectsNonNumeric() {
        assertThatThrownBy(() -> FieldType.NUMBER.normalize("abc", Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void booleanAcceptsBooleanOnly() {
        assertThat(FieldType.BOOLEAN.normalize(true, Map.of())).isEqualTo(true);
        assertThatThrownBy(() -> FieldType.BOOLEAN.normalize("true", Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void dateParsesIsoAndRejectsBadFormat() {
        assertThat(FieldType.DATE.normalize("2026-10-23", Map.of())).isEqualTo("2026-10-23");
        assertThatThrownBy(() -> FieldType.DATE.normalize("23/10/2026", Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void timeParsesIsoAndRejectsBadFormat() {
        assertThat(FieldType.TIME.normalize("14:30:00", Map.of())).isEqualTo("14:30:00");
        assertThatThrownBy(() -> FieldType.TIME.normalize("2pm", Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void dateTimeParsesIsoOffset() {
        assertThat(FieldType.DATETIME.normalize("2026-10-23T14:30:00+02:00", Map.of()))
                .isEqualTo("2026-10-23T14:30:00+02:00");
        assertThatThrownBy(() -> FieldType.DATETIME.normalize("not-a-datetime", Map.of()))
                .isInstanceOf(FieldValidationException.class);
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=FieldTypeTest`
Expected: FAIL — `FieldType` / `FieldValidationException` do not exist.

- [ ] **Step 3: Write `FieldValidationException`**

`backend/src/main/java/eu/planetsoft/zerocode/service/FieldValidationException.java`:

```java
package eu.planetsoft.zerocode.service;

public class FieldValidationException extends RuntimeException {
    public FieldValidationException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Write the `FieldType` enum**

`backend/src/main/java/eu/planetsoft/zerocode/domain/FieldType.java`:

```java
package eu.planetsoft.zerocode.domain;

import eu.planetsoft.zerocode.service.FieldValidationException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;

public enum FieldType {

    TEXT {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            if (!(raw instanceof String s)) {
                throw new FieldValidationException("expected a text value");
            }
            Integer maxLength = asInt(constraints.get("maxLength"));
            if (maxLength != null && s.length() > maxLength) {
                throw new FieldValidationException(
                        "exceeds maxLength of " + maxLength);
            }
            return s;
        }
    },

    NUMBER {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            if (!(raw instanceof Number n)) {
                throw new FieldValidationException("expected a numeric value");
            }
            BigDecimal value = new BigDecimal(n.toString());
            BigDecimal min = asDecimal(constraints.get("min"));
            BigDecimal max = asDecimal(constraints.get("max"));
            if (min != null && value.compareTo(min) < 0) {
                throw new FieldValidationException("below min of " + min);
            }
            if (max != null && value.compareTo(max) > 0) {
                throw new FieldValidationException("above max of " + max);
            }
            return value;
        }
    },

    BOOLEAN {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            if (!(raw instanceof Boolean b)) {
                throw new FieldValidationException("expected a boolean value");
            }
            return b;
        }
    },

    DATE {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            String s = asString(raw);
            try {
                LocalDate.parse(s);
            } catch (DateTimeParseException e) {
                throw new FieldValidationException("expected a date (yyyy-MM-dd)");
            }
            return s;
        }
    },

    TIME {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            String s = asString(raw);
            try {
                LocalTime.parse(s);
            } catch (DateTimeParseException e) {
                throw new FieldValidationException("expected a time (HH:mm:ss)");
            }
            return s;
        }
    },

    DATETIME {
        @Override
        public Object normalize(Object raw, Map<String, Object> constraints) {
            String s = asString(raw);
            try {
                OffsetDateTime.parse(s);
            } catch (DateTimeParseException e) {
                throw new FieldValidationException(
                        "expected an ISO-8601 offset date-time");
            }
            return s;
        }
    };

    /**
     * Validate {@code raw} against this type and its constraints, returning the
     * canonical JSON-storable value. Throws {@link FieldValidationException} on
     * any violation.
     */
    public abstract Object normalize(Object raw, Map<String, Object> constraints);

    static String asString(Object raw) {
        if (!(raw instanceof String s)) {
            throw new FieldValidationException("expected a string value");
        }
        return s;
    }

    static Integer asInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        throw new FieldValidationException("constraint must be numeric");
    }

    static BigDecimal asDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        throw new FieldValidationException("constraint must be numeric");
    }
}
```

- [ ] **Step 5: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=FieldTypeTest`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/domain/FieldType.java backend/src/main/java/eu/planetsoft/zerocode/service/FieldValidationException.java backend/src/test/java/eu/planetsoft/zerocode/domain/FieldTypeTest.java
git commit -m "feat(backend): add FieldType enum with per-type validation"
```

---

### Task 4: Schema, JPA entities, repositories

**Files:**
- Modify: `backend/src/main/resources/db/migration/V1__schema.sql` (replace placeholder with real schema)
- Create: `backend/src/main/java/eu/planetsoft/zerocode/domain/FieldDefinition.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/domain/Item.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/repository/FieldDefinitionRepository.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/repository/ItemRepository.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/repository/RepositoryIntegrationTest.java`

**Interfaces:**
- Produces:
  - `FieldDefinition` entity: `UUID id`, `String fieldKey`, `String label`, `FieldType type`, `boolean required`, `Map<String,Object> constraints`, `int displayOrder`, `boolean deleted`, `OffsetDateTime createdAt`.
  - `Item` entity: `UUID id`, `String name`, `String description`, `Map<String,Object> customValues`, `OffsetDateTime createdAt`, `OffsetDateTime updatedAt`.
  - `FieldDefinitionRepository`: `findByDeletedFalseOrderByDisplayOrderAsc()`, `findByFieldKeyAndDeletedFalse(String)`, `countByDeletedFalse()`.
  - `ItemRepository`: standard `JpaRepository<Item, UUID>`.
- Consumes: `FieldType` (Task 3).

- [ ] **Step 1: Write the failing integration test**

`backend/src/test/java/eu/planetsoft/zerocode/repository/RepositoryIntegrationTest.java`:

```java
package eu.planetsoft.zerocode.repository;

import static org.assertj.core.api.Assertions.assertThat;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import java.time.OffsetDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class RepositoryIntegrationTest extends PostgresIntegrationTest {

    @Autowired
    FieldDefinitionRepository fields;

    @Autowired
    ItemRepository items;

    @Test
    void persistsFieldDefinitionWithJsonbConstraints() {
        FieldDefinition def = new FieldDefinition();
        def.setFieldKey("qty");
        def.setLabel("Quantity");
        def.setType(FieldType.NUMBER);
        def.setRequired(true);
        def.setConstraints(Map.of("min", 0, "max", 100));
        def.setDisplayOrder(0);
        def.setCreatedAt(OffsetDateTime.now());

        FieldDefinition saved = fields.save(def);

        assertThat(saved.getId()).isNotNull();
        assertThat(fields.findByFieldKeyAndDeletedFalse("qty")).isPresent();
        assertThat(fields.findByDeletedFalseOrderByDisplayOrderAsc()).hasSize(1);
        assertThat(fields.countByDeletedFalse()).isEqualTo(1);
    }

    @Test
    void persistsItemWithJsonbCustomValues() {
        Item item = new Item();
        item.setName("Widget");
        item.setDescription("A widget");
        item.setCustomValues(Map.of("color", "red", "qty", 5));
        OffsetDateTime now = OffsetDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        Item saved = items.save(item);

        assertThat(saved.getId()).isNotNull();
        Item loaded = items.findById(saved.getId()).orElseThrow();
        assertThat(loaded.getCustomValues()).containsEntry("color", "red");
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=RepositoryIntegrationTest`
Expected: FAIL — entities/repositories do not exist (compilation failure).

- [ ] **Step 3: Replace `V1__schema.sql` with the real schema**

`backend/src/main/resources/db/migration/V1__schema.sql`:

```sql
CREATE TABLE field_definition (
    id            uuid PRIMARY KEY,
    field_key     text        NOT NULL,
    label         text        NOT NULL,
    type          text        NOT NULL,
    required      boolean      NOT NULL DEFAULT false,
    constraints   jsonb        NOT NULL DEFAULT '{}'::jsonb,
    display_order integer      NOT NULL,
    deleted       boolean      NOT NULL DEFAULT false,
    created_at    timestamptz  NOT NULL
);

-- field_key unique only among active (non-deleted) definitions
CREATE UNIQUE INDEX ux_field_definition_active_key
    ON field_definition (field_key)
    WHERE deleted = false;

CREATE TABLE item (
    id            uuid PRIMARY KEY,
    name          text         NOT NULL,
    description   text,
    custom_values jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz  NOT NULL,
    updated_at    timestamptz  NOT NULL
);
```

- [ ] **Step 4: Write the `FieldDefinition` entity**

`backend/src/main/java/eu/planetsoft/zerocode/domain/FieldDefinition.java`:

```java
package eu.planetsoft.zerocode.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "field_definition")
public class FieldDefinition {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "field_key", nullable = false)
    private String fieldKey;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FieldType type;

    @Column(nullable = false)
    private boolean required;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private Map<String, Object> constraints = new HashMap<>();

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    // getters / setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public FieldType getType() { return type; }
    public void setType(FieldType type) { this.type = type; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public Map<String, Object> getConstraints() { return constraints; }
    public void setConstraints(Map<String, Object> constraints) { this.constraints = constraints; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 5: Write the `Item` entity**

`backend/src/main/java/eu/planetsoft/zerocode/domain/Item.java`:

```java
package eu.planetsoft.zerocode.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "item")
public class Item {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_values", nullable = false)
    private Map<String, Object> customValues = new HashMap<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Map<String, Object> getCustomValues() { return customValues; }
    public void setCustomValues(Map<String, Object> customValues) { this.customValues = customValues; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 6: Write the repositories**

`backend/src/main/java/eu/planetsoft/zerocode/repository/FieldDefinitionRepository.java`:

```java
package eu.planetsoft.zerocode.repository;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FieldDefinitionRepository extends JpaRepository<FieldDefinition, UUID> {

    List<FieldDefinition> findByDeletedFalseOrderByDisplayOrderAsc();

    Optional<FieldDefinition> findByFieldKeyAndDeletedFalse(String fieldKey);

    long countByDeletedFalse();
}
```

`backend/src/main/java/eu/planetsoft/zerocode/repository/ItemRepository.java`:

```java
package eu.planetsoft.zerocode.repository;

import eu.planetsoft.zerocode.domain.Item;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, UUID> {
}
```

- [ ] **Step 7: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=RepositoryIntegrationTest`
Expected: PASS (2 tests). Flyway applies V1, entities validate against the schema, JSONB round-trips.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/resources/db/migration/V1__schema.sql backend/src/main/java/eu/planetsoft/zerocode/domain backend/src/main/java/eu/planetsoft/zerocode/repository backend/src/test/java/eu/planetsoft/zerocode/repository
git commit -m "feat(backend): add schema, JPA entities and repositories with JSONB"
```

---

### Task 5: Global exception handler (RFC 7807 ProblemDetail)

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/service/ItemValidationException.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/web/GlobalExceptionHandler.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/web/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Produces:
  - `ItemValidationException extends RuntimeException` with `Map<String,String> getErrors()` (fieldKey → message).
  - `FieldTypeChangeException extends RuntimeException` (thrown later by `FieldDefinitionService`); handled as `409`.
  - `NotFoundException extends RuntimeException`; handled as `404`.
  - `GlobalExceptionHandler` `@RestControllerAdvice` mapping those to `ProblemDetail` (400 with `errors` property, 409, 404 respectively).
- Consumes: nothing from prior tasks except exception classes defined here.

- [ ] **Step 1: Write the failing test** (uses a tiny throwaway controller to exercise the advice)

`backend/src/test/java/eu/planetsoft/zerocode/web/GlobalExceptionHandlerTest.java`:

```java
package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import eu.planetsoft.zerocode.service.ItemValidationException;
import eu.planetsoft.zerocode.service.NotFoundException;
import eu.planetsoft.zerocode.service.FieldTypeChangeException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = GlobalExceptionHandlerTest.TestController.class)
@Import({GlobalExceptionHandler.class})
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
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=GlobalExceptionHandlerTest`
Expected: FAIL — exception classes / handler do not exist.

- [ ] **Step 3: Write the exception classes**

`backend/src/main/java/eu/planetsoft/zerocode/service/ItemValidationException.java`:

```java
package eu.planetsoft.zerocode.service;

import java.util.Map;

public class ItemValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public ItemValidationException(Map<String, String> errors) {
        super("Item validation failed");
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
```

`backend/src/main/java/eu/planetsoft/zerocode/service/NotFoundException.java`:

```java
package eu.planetsoft.zerocode.service;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
```

`backend/src/main/java/eu/planetsoft/zerocode/service/FieldTypeChangeException.java`:

```java
package eu.planetsoft.zerocode.service;

public class FieldTypeChangeException extends RuntimeException {
    public FieldTypeChangeException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Write the handler**

`backend/src/main/java/eu/planetsoft/zerocode/web/GlobalExceptionHandler.java`:

```java
package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.service.FieldTypeChangeException;
import eu.planetsoft.zerocode.service.ItemValidationException;
import eu.planetsoft.zerocode.service.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ItemValidationException.class)
    ProblemDetail onItemValidation(ItemValidationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Validation failed");
        pd.setProperty("errors", ex.getErrors());
        return pd;
    }

    @ExceptionHandler(FieldTypeChangeException.class)
    ProblemDetail onTypeChange(FieldTypeChangeException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Field type is immutable");
        return pd;
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail onNotFound(NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Not found");
        return pd;
    }
}
```

- [ ] **Step 5: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=GlobalExceptionHandlerTest`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/service/ItemValidationException.java backend/src/main/java/eu/planetsoft/zerocode/service/NotFoundException.java backend/src/main/java/eu/planetsoft/zerocode/service/FieldTypeChangeException.java backend/src/main/java/eu/planetsoft/zerocode/web/GlobalExceptionHandler.java backend/src/test/java/eu/planetsoft/zerocode/web/GlobalExceptionHandlerTest.java
git commit -m "feat(backend): add ProblemDetail exception handling"
```

---

### Task 6: Field definition service + controller

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/service/FieldDefinitionService.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/web/dto/FieldDefinitionDtos.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/web/FieldDefinitionController.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/web/FieldDefinitionControllerTest.java`

**Interfaces:**
- Produces:
  - `FieldDefinitionService.create(label, type, required, constraints) -> FieldDefinition` — derives unique `field_key` (slugify + `_2`, `_3` suffix on active collision), assigns `displayOrder = countByDeletedFalse()`.
  - `FieldDefinitionService.update(id, label, required, constraints, displayOrder) -> FieldDefinition` — never changes type (there is no type parameter; a separate guarded path throws `FieldTypeChangeException` if a caller supplies a differing type — see controller).
  - `FieldDefinitionService.list() -> List<FieldDefinition>` (active, ordered).
  - `FieldDefinitionService.softDelete(id)`.
- Consumes: `FieldDefinitionRepository` (Task 4), `FieldKeys` (Task 2), `FieldType` (Task 3), exceptions (Task 5).

- [ ] **Step 1: Write the failing integration test**

`backend/src/test/java/eu/planetsoft/zerocode/web/FieldDefinitionControllerTest.java`:

```java
package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
class FieldDefinitionControllerTest extends PostgresIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;

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
                .andExpect(jsonPath("$[0].fieldKey").value("unit_price"));
    }

    @Test
    void patchingTypeReturns409() throws Exception {
        String body = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Color","type":"TEXT","required":false,"constraints":{}}"""))
                .andReturn().getResponse().getContentAsString();
        String id = om.readTree(body).get("id").asText();

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
        String id = om.readTree(body).get("id").asText();

        mockMvc.perform(delete("/api/fields/" + id)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=FieldDefinitionControllerTest`
Expected: FAIL — service/controller/DTOs do not exist.

- [ ] **Step 3: Write the DTOs**

`backend/src/main/java/eu/planetsoft/zerocode/web/dto/FieldDefinitionDtos.java`:

```java
package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class FieldDefinitionDtos {

    private FieldDefinitionDtos() {
    }

    public record CreateRequest(
            @NotBlank String label,
            @NotNull FieldType type,
            boolean required,
            Map<String, Object> constraints) {
    }

    public record UpdateRequest(
            @NotBlank String label,
            FieldType type,
            boolean required,
            Map<String, Object> constraints,
            Integer displayOrder) {
    }

    public record Response(
            UUID id,
            String fieldKey,
            String label,
            FieldType type,
            boolean required,
            Map<String, Object> constraints,
            int displayOrder,
            OffsetDateTime createdAt) {

        public static Response from(FieldDefinition d) {
            return new Response(d.getId(), d.getFieldKey(), d.getLabel(), d.getType(),
                    d.isRequired(), d.getConstraints(), d.getDisplayOrder(), d.getCreatedAt());
        }
    }
}
```

- [ ] **Step 4: Write the service**

`backend/src/main/java/eu/planetsoft/zerocode/service/FieldDefinitionService.java`:

```java
package eu.planetsoft.zerocode.service;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.FieldType;
import eu.planetsoft.zerocode.repository.FieldDefinitionRepository;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FieldDefinitionService {

    private final FieldDefinitionRepository repository;

    public FieldDefinitionService(FieldDefinitionRepository repository) {
        this.repository = repository;
    }

    public List<FieldDefinition> list() {
        return repository.findByDeletedFalseOrderByDisplayOrderAsc();
    }

    @Transactional
    public FieldDefinition create(String label, FieldType type, boolean required,
                                  Map<String, Object> constraints) {
        FieldDefinition def = new FieldDefinition();
        def.setFieldKey(uniqueKey(FieldKeys.slugify(label)));
        def.setLabel(label);
        def.setType(type);
        def.setRequired(required);
        def.setConstraints(constraints == null ? new HashMap<>() : constraints);
        def.setDisplayOrder((int) repository.countByDeletedFalse());
        def.setCreatedAt(OffsetDateTime.now());
        return repository.save(def);
    }

    @Transactional
    public FieldDefinition update(UUID id, String label, FieldType type, boolean required,
                                  Map<String, Object> constraints, Integer displayOrder) {
        FieldDefinition def = repository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new NotFoundException("Field definition not found"));
        if (type != null && type != def.getType()) {
            throw new FieldTypeChangeException("Field type is immutable once created");
        }
        def.setLabel(label);
        def.setRequired(required);
        if (constraints != null) {
            def.setConstraints(constraints);
        }
        if (displayOrder != null) {
            def.setDisplayOrder(displayOrder);
        }
        return repository.save(def);
    }

    @Transactional
    public void softDelete(UUID id) {
        FieldDefinition def = repository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new NotFoundException("Field definition not found"));
        def.setDeleted(true);
        repository.save(def);
    }

    private String uniqueKey(String base) {
        String candidate = base;
        int suffix = 2;
        while (repository.findByFieldKeyAndDeletedFalse(candidate).isPresent()) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }
}
```

- [ ] **Step 5: Write the controller**

`backend/src/main/java/eu/planetsoft/zerocode/web/FieldDefinitionController.java`:

```java
package eu.planetsoft.zerocode.web;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.service.FieldDefinitionService;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.CreateRequest;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.Response;
import eu.planetsoft.zerocode.web.dto.FieldDefinitionDtos.UpdateRequest;
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
    public List<Response> list() {
        return service.list().stream().map(Response::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response create(@Valid @RequestBody CreateRequest req) {
        FieldDefinition def = service.create(
                req.label(), req.type(), req.required(), req.constraints());
        return Response.from(def);
    }

    @PatchMapping("/{id}")
    public Response update(@PathVariable UUID id, @Valid @RequestBody UpdateRequest req) {
        FieldDefinition def = service.update(
                id, req.label(), req.type(), req.required(),
                req.constraints(), req.displayOrder());
        return Response.from(def);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 6: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=FieldDefinitionControllerTest`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/service/FieldDefinitionService.java backend/src/main/java/eu/planetsoft/zerocode/web/dto/FieldDefinitionDtos.java backend/src/main/java/eu/planetsoft/zerocode/web/FieldDefinitionController.java backend/src/test/java/eu/planetsoft/zerocode/web/FieldDefinitionControllerTest.java
git commit -m "feat(backend): add field definition CRUD API"
```

---

### Task 7: Item service + controller with custom-value validation

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/service/ItemService.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/web/dto/ItemDtos.java`
- Create: `backend/src/main/java/eu/planetsoft/zerocode/web/ItemController.java`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/web/ItemControllerTest.java`

**Interfaces:**
- Produces:
  - `ItemService.validateAndNormalize(Map<String,Object> raw) -> Map<String,Object>` — against active defs: rejects unknown keys, enforces `required`, calls `FieldType.normalize`; collects all failures into `ItemValidationException`.
  - `ItemService.create/get/list/update/delete`.
- Consumes: `ItemRepository`, `FieldDefinitionRepository` (Task 4), `FieldType` (Task 3), exceptions (Task 5).

- [ ] **Step 1: Write the failing integration test**

`backend/src/test/java/eu/planetsoft/zerocode/web/ItemControllerTest.java`:

```java
package eu.planetsoft.zerocode.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
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
}
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=ItemControllerTest`
Expected: FAIL — item service/controller/DTOs do not exist.

- [ ] **Step 3: Write the DTOs**

`backend/src/main/java/eu/planetsoft/zerocode/web/dto/ItemDtos.java`:

```java
package eu.planetsoft.zerocode.web.dto;

import eu.planetsoft.zerocode.domain.Item;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class ItemDtos {

    private ItemDtos() {
    }

    public record CreateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

    public record UpdateRequest(
            @NotBlank String name,
            String description,
            Map<String, Object> customValues) {
    }

    public record Response(
            UUID id,
            String name,
            String description,
            Map<String, Object> customValues,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        public static Response from(Item i) {
            return new Response(i.getId(), i.getName(), i.getDescription(),
                    i.getCustomValues(), i.getCreatedAt(), i.getUpdatedAt());
        }
    }
}
```

- [ ] **Step 4: Write the service**

`backend/src/main/java/eu/planetsoft/zerocode/service/ItemService.java`:

```java
package eu.planetsoft.zerocode.service;

import eu.planetsoft.zerocode.domain.FieldDefinition;
import eu.planetsoft.zerocode.domain.Item;
import eu.planetsoft.zerocode.repository.FieldDefinitionRepository;
import eu.planetsoft.zerocode.repository.ItemRepository;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository items;
    private final FieldDefinitionRepository fields;

    public ItemService(ItemRepository items, FieldDefinitionRepository fields) {
        this.items = items;
        this.fields = fields;
    }

    public List<Item> list() {
        return items.findAll();
    }

    public Item get(UUID id) {
        return items.findById(id)
                .orElseThrow(() -> new NotFoundException("Item not found"));
    }

    @Transactional
    public Item create(String name, String description, Map<String, Object> customValues) {
        Item item = new Item();
        item.setName(name);
        item.setDescription(description);
        item.setCustomValues(validateAndNormalize(customValues));
        OffsetDateTime now = OffsetDateTime.now();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);
        return items.save(item);
    }

    @Transactional
    public Item update(UUID id, String name, String description, Map<String, Object> customValues) {
        Item item = get(id);
        item.setName(name);
        item.setDescription(description);
        item.setCustomValues(validateAndNormalize(customValues));
        item.setUpdatedAt(OffsetDateTime.now());
        return items.save(item);
    }

    @Transactional
    public void delete(UUID id) {
        if (!items.existsById(id)) {
            throw new NotFoundException("Item not found");
        }
        items.deleteById(id);
    }

    Map<String, Object> validateAndNormalize(Map<String, Object> raw) {
        Map<String, Object> input = raw == null ? Map.of() : raw;
        List<FieldDefinition> active = fields.findByDeletedFalseOrderByDisplayOrderAsc();
        Map<String, String> errors = new LinkedHashMap<>();
        Map<String, Object> normalized = new HashMap<>();

        // unknown keys
        Map<String, FieldDefinition> byKey = new HashMap<>();
        active.forEach(d -> byKey.put(d.getFieldKey(), d));
        for (String key : input.keySet()) {
            if (!byKey.containsKey(key)) {
                errors.put(key, "unknown field");
            }
        }

        for (FieldDefinition def : active) {
            Object value = input.get(def.getFieldKey());
            if (value == null) {
                if (def.isRequired()) {
                    errors.put(def.getFieldKey(), "is required");
                }
                continue;
            }
            try {
                normalized.put(def.getFieldKey(),
                        def.getType().normalize(value, def.getConstraints()));
            } catch (FieldValidationException e) {
                errors.put(def.getFieldKey(), e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new ItemValidationException(errors);
        }
        return normalized;
    }
}
```

- [ ] **Step 5: Write the controller**

`backend/src/main/java/eu/planetsoft/zerocode/web/ItemController.java`:

```java
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
```

- [ ] **Step 6: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=ItemControllerTest`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/service/ItemService.java backend/src/main/java/eu/planetsoft/zerocode/web/dto/ItemDtos.java backend/src/main/java/eu/planetsoft/zerocode/web/ItemController.java backend/src/test/java/eu/planetsoft/zerocode/web/ItemControllerTest.java
git commit -m "feat(backend): add item CRUD API with custom-value validation"
```

---

### Task 8: OpenAPI config, seed data, end-to-end flow

**Files:**
- Create: `backend/src/main/java/eu/planetsoft/zerocode/config/OpenApiConfig.java`
- Create: `backend/src/main/resources/db/migration/V2__seed.sql`
- Test: `backend/src/test/java/eu/planetsoft/zerocode/EndToEndFlowTest.java`

**Interfaces:**
- Consumes: everything above.
- Produces: a browsable `/swagger-ui.html` + `/v3/api-docs`; seed data; the end-to-end lifecycle test (the spec's acceptance scenario).

- [ ] **Step 1: Write the failing end-to-end test** (covers the full lifecycle incl. soft-delete orphan behavior)

`backend/src/test/java/eu/planetsoft/zerocode/EndToEndFlowTest.java`:

```java
package eu.planetsoft.zerocode;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import eu.planetsoft.zerocode.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
class EndToEndFlowTest extends PostgresIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;

    @Test
    void fieldLifecycleThenOrphanedValueIgnored() throws Exception {
        // create field
        String fieldBody = mockMvc.perform(post("/api/fields")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"label":"Color","type":"TEXT","required":true,"constraints":{}}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String fieldId = om.readTree(fieldBody).get("id").asText();

        // create item with that field
        String itemBody = mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Widget","customValues":{"color":"red"}}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String itemId = om.readTree(itemBody).get("id").asText();

        // soft-delete the field
        mockMvc.perform(delete("/api/fields/" + fieldId)).andExpect(status().isNoContent());

        // the orphaned value is still physically stored on the item, but the field
        // is gone from the active definition list
        mockMvc.perform(get("/api/fields"))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customValues.color").value("red"));
    }

    @Test
    void seedDataIsPresent() throws Exception {
        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }
}
```

Note: `seedDataIsPresent` asserts the V2 seed loaded. Because `fieldLifecycleThenOrphanedValueIgnored` also runs against the seeded schema, it tolerates seed fields by asserting on the specific keys/items it creates rather than exact list sizes — except the post-delete `$.length()` check. To keep that check valid, **the seed must not insert field definitions that remain active after this test deletes its own** — see Step 3: seed fields are created but the e2e test's size assertions account for them. **Adjust:** change the two `$.length()` assertions in this test to `greaterThanOrEqualTo` the seed count if you keep seed fields active. Simplest: keep seed data as described in Step 3 (2 fields + 2 items) and update the first test's post-delete assertion to check that `color` is absent from the active list instead of total size:

Replace the post-delete active-list assertion with:

```java
        mockMvc.perform(get("/api/fields"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.fieldKey=='color')]").isEmpty());
```

- [ ] **Step 2: Run to verify it fails**

Run (from `backend/`): `mvn -q test -Dtest=EndToEndFlowTest`
Expected: FAIL — no seed data (`seedDataIsPresent` fails) and/or `OpenApiConfig` missing.

- [ ] **Step 3: Write the seed migration**

`backend/src/main/resources/db/migration/V2__seed.sql`:

```sql
INSERT INTO field_definition (id, field_key, label, type, required, constraints, display_order, deleted, created_at)
VALUES
  (gen_random_uuid(), 'color', 'Color', 'TEXT', false, '{"maxLength": 40}'::jsonb, 0, false, now()),
  (gen_random_uuid(), 'quantity', 'Quantity', 'NUMBER', true, '{"min": 0}'::jsonb, 1, false, now());

INSERT INTO item (id, name, description, custom_values, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Sample Widget', 'A seeded demo item',
   '{"color": "red", "quantity": 10}'::jsonb, now(), now()),
  (gen_random_uuid(), 'Sample Gadget', 'Another seeded item',
   '{"quantity": 3}'::jsonb, now(), now());
```

Note: `gen_random_uuid()` is built into Postgres 13+ (pgcrypto bundled); no extension needed on the `postgres:16-alpine` image.

Because of the seed, update the `EndToEndFlowTest` first test to use the `color`-absent assertion shown in Step 1 (not a total-size assertion), since seeded fields remain active.

- [ ] **Step 4: Write the OpenAPI config**

`backend/src/main/java/eu/planetsoft/zerocode/config/OpenApiConfig.java`:

```java
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
```

- [ ] **Step 5: Run to verify it passes**

Run (from `backend/`): `mvn -q test -Dtest=EndToEndFlowTest`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full test suite**

Run (from `backend/`): `mvn -q test`
Expected: BUILD SUCCESS; all tests from Tasks 1–8 pass.

- [ ] **Step 7: Manually verify Swagger against the live app** (optional but recommended)

```bash
docker compose up -d app-db
cd backend && mvn spring-boot:run
```

Then open `http://localhost:8080/swagger-ui.html` — confirm `/api/fields` and `/api/items` are listed and the seeded data returns from `GET /api/items`. Stop with Ctrl+C; `docker compose stop app-db`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/eu/planetsoft/zerocode/config/OpenApiConfig.java backend/src/main/resources/db/migration/V2__seed.sql backend/src/test/java/eu/planetsoft/zerocode/EndToEndFlowTest.java
git commit -m "feat(backend): add OpenAPI config, seed data and end-to-end flow test"
```

---

## Self-Review Notes

- **Spec coverage:** scope (one entity, dynamic fields) → Tasks 4/6/7; JSONB storage → Task 4; field types → Task 3; API surface → Tasks 6/7; validation + lifecycle (type-immutable 409, soft delete, display_order, updatedAt) → Tasks 4/6/7; layering (web/service/repository/domain + fieldtype logic in enum) → all; infra (app-db, Flyway V1+V2 seed) → Tasks 1/4/8; testing (unit per type + field_key, Testcontainers integration incl. orphan flow) → Tasks 2/3/8.
- **Type consistency:** `FieldType.normalize(Object, Map<String,Object>)`, `FieldDefinitionService.create/update/list/softDelete`, `ItemService.validateAndNormalize` and repository method names are used identically across tasks.
- **Known caveat baked into Task 8:** seed data makes exact list-size assertions fragile; Task 8 Step 1/3 explicitly switch the lifecycle test to a `fieldKey`-absent assertion to stay robust against seeded rows.
