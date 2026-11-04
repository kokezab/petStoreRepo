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
    void dateEnforcesMinMax() {
        Map<String, Object> range = Map.of("min", "2026-01-01", "max", "2026-12-31");
        assertThat(FieldType.DATE.normalize("2026-06-15", range)).isEqualTo("2026-06-15");
        assertThatThrownBy(() -> FieldType.DATE.normalize("2025-12-31", range))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("min");
        assertThatThrownBy(() -> FieldType.DATE.normalize("2027-01-01", range))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("max");
    }

    @Test
    void dateTimeEnforcesMinMaxAcrossOffsets() {
        Map<String, Object> range = Map.of(
                "min", "2026-10-23T10:00:00Z", "max", "2026-10-23T18:00:00Z");
        // 12:30+02:00 is 10:30Z, inside the range.
        assertThat(FieldType.DATETIME.normalize("2026-10-23T12:30:00+02:00", range))
                .isEqualTo("2026-10-23T12:30:00+02:00");
        assertThatThrownBy(() -> FieldType.DATETIME.normalize("2026-10-23T11:00:00+02:00", range))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("min");
        assertThatThrownBy(() -> FieldType.DATETIME.normalize("2026-10-23T19:00:00Z", range))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("max");
    }

    @Test
    void dateConstraintsMustBeValidAndOrdered() {
        FieldType.DATE.validateConstraints(Map.of("min", "2026-01-01"));
        assertThatThrownBy(() -> FieldType.DATE.validateConstraints(Map.of("min", 5)))
                .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> FieldType.DATE.validateConstraints(
                Map.of("min", "2026-12-31", "max", "2026-01-01")))
                .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> FieldType.DATETIME.validateConstraints(
                Map.of("max", "2026-10-23")))
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

    @Test
    void timeNormalizesToCanonicalSecondsForm() {
        assertThat(FieldType.TIME.normalize("14:30", Map.of())).isEqualTo("14:30:00");
    }

    @Test
    void numberAcceptsInclusiveBoundaries() {
        assertThat(FieldType.NUMBER.normalize(0, Map.of("min", 0, "max", 10)))
                .isEqualTo(new BigDecimal("0"));
        assertThat(FieldType.NUMBER.normalize(10, Map.of("min", 0, "max", 10)))
                .isEqualTo(new BigDecimal("10"));
    }

    @Test
    void textAcceptsExactMaxLength() {
        assertThat(FieldType.TEXT.normalize("abc", Map.of("maxLength", 3))).isEqualTo("abc");
    }
}
