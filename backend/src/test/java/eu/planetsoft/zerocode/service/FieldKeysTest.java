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

    @Test
    void rejectsNullLabel() {
        assertThatThrownBy(() -> FieldKeys.slugify(null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
