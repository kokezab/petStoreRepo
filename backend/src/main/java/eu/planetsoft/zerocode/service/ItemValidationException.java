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
