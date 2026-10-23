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
