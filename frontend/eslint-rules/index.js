import requireAriaLabelI18n from './require-aria-label-i18n.js';

/**
 * Repo-local ESLint plugin. Houses rules that encode conventions specific to
 * this codebase and aren't covered by an off-the-shelf plugin.
 *
 * @type {import('eslint').ESLint.Plugin}
 */
const localPlugin = {
  rules: {
    'require-aria-label-i18n': requireAriaLabelI18n,
  },
};

export default localPlugin;
