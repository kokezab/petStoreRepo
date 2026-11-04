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
            LocalDate value;
            try {
                value = LocalDate.parse(s);
            } catch (DateTimeParseException e) {
                throw new FieldValidationException("expected a date (yyyy-MM-dd)");
            }
            LocalDate min = asDate(constraints.get("min"));
            LocalDate max = asDate(constraints.get("max"));
            if (min != null && value.isBefore(min)) {
                throw new FieldValidationException("before min of " + min);
            }
            if (max != null && value.isAfter(max)) {
                throw new FieldValidationException("after max of " + max);
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
            OffsetDateTime value;
            try {
                value = OffsetDateTime.parse(s);
            } catch (DateTimeParseException e) {
                throw new FieldValidationException(
                        "expected an ISO-8601 offset date-time");
            }
            OffsetDateTime min = asDateTime(constraints.get("min"));
            OffsetDateTime max = asDateTime(constraints.get("max"));
            if (min != null && value.isBefore(min)) {
                throw new FieldValidationException("before min of " + min);
            }
            if (max != null && value.isAfter(max)) {
                throw new FieldValidationException("after max of " + max);
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

    static LocalDate asDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String s) {
            try {
                return LocalDate.parse(s);
            } catch (DateTimeParseException e) {
                // fall through to the shared error below
            }
        }
        throw new FieldValidationException("constraint must be a date (yyyy-MM-dd)");
    }

    static OffsetDateTime asDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String s) {
            try {
                return OffsetDateTime.parse(s);
            } catch (DateTimeParseException e) {
                // fall through to the shared error below
            }
        }
        throw new FieldValidationException(
                "constraint must be an ISO-8601 offset date-time");
    }

    /**
     * Validate that this type's supported constraint keys, if present, hold
     * values of the right JSON type. Throws {@link FieldValidationException}
     * on a malformed constraint so it is rejected at field-definition time
     * rather than surfacing later as a confusing item-write failure.
     */
    public void validateConstraints(Map<String, Object> constraints) {
        if (constraints == null) {
            return;
        }
        switch (this) {
            case TEXT -> {
                if (constraints.containsKey("maxLength")) {
                    asInt(constraints.get("maxLength"));
                }
            }
            case NUMBER -> {
                if (constraints.containsKey("min")) {
                    asDecimal(constraints.get("min"));
                }
                if (constraints.containsKey("max")) {
                    asDecimal(constraints.get("max"));
                }
            }
            case DATE -> {
                LocalDate min = asDate(constraints.get("min"));
                LocalDate max = asDate(constraints.get("max"));
                if (min != null && max != null && max.isBefore(min)) {
                    throw new FieldValidationException("max must not be before min");
                }
            }
            case DATETIME -> {
                OffsetDateTime min = asDateTime(constraints.get("min"));
                OffsetDateTime max = asDateTime(constraints.get("max"));
                if (min != null && max != null && max.isBefore(min)) {
                    throw new FieldValidationException("max must not be before min");
                }
            }
            default -> {
            }
        }
    }
}
