package eu.planetsoft.zerocode.domain;

import eu.planetsoft.zerocode.service.FieldValidationException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
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
                return LocalTime.parse(s).format(DateTimeFormatter.ofPattern("HH:mm:ss"));
            } catch (DateTimeParseException e) {
                throw new FieldValidationException("expected a time (HH:mm:ss)");
            }
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
