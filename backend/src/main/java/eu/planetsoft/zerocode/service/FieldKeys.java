package eu.planetsoft.zerocode.service;

import java.util.Locale;

public final class FieldKeys {

    private FieldKeys() {
    }

    /**
     * Converts a label to a field key by lowercasing (using Locale.ROOT),
     * collapsing each run of non-alphanumeric characters to a single underscore,
     * and stripping leading and trailing underscores.
     *
     * @param label the input label (must not be null)
     * @return the resulting field key
     * @throws IllegalArgumentException if label is null or produces an empty key
     */
    public static String slugify(String label) {
        if (label == null) {
            throw new IllegalArgumentException("label must not be null");
        }
        String key = label.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (key.isEmpty()) {
            throw new IllegalArgumentException(
                    "label '" + label + "' produces an empty field key");
        }
        return key;
    }
}
