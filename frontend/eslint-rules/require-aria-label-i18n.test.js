import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import rule from './require-aria-label-i18n.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
    },
  },
});

ruleTester.run('require-aria-label-i18n', rule, {
  valid: [
    // The translator call — the whole point.
    { code: "const A = () => <button aria-label={t('a.b')} />;" },
    // A variable / member access is trusted (origin not visible here).
    { code: 'const A = () => <button aria-label={label} />;' },
    { code: 'const A = () => <button aria-label={row.label} />;' },
    // Every branch of ?: and || must be translated — these are.
    { code: "const A = () => <button aria-label={cond ? t('a') : t('b')} />;" },
    { code: "const A = () => <button aria-label={t('a') || t('b')} />;" },
    // No aria-label at all — nothing to check.
    { code: 'const A = () => <button />;' },
    // Other attributes are ignored.
    { code: 'const A = () => <button title="Close" />;' },
  ],
  invalid: [
    {
      code: 'const A = () => <button aria-label="Close" />;',
      errors: [{ messageId: 'requireI18n' }],
    },
    {
      code: 'const A = () => <button aria-label={`User ${i}`} />;',
      errors: [{ messageId: 'requireI18n' }],
    },
    {
      code: "const A = () => <button aria-label={'Close'} />;",
      errors: [{ messageId: 'requireI18n' }],
    },
    {
      // One bad branch is still caught.
      code: "const A = () => <button aria-label={cond ? t('a') : 'B'} />;",
      errors: [{ messageId: 'requireI18n' }],
    },
  ],
});
