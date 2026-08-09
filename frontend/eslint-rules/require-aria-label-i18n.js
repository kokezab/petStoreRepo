/**
 * @fileoverview Require JSX `aria-label` values to be translated.
 *
 * An `aria-label` is user-facing text (screen readers read it aloud), so it must
 * go through the `t()` translator from `useLocalization` — never a hardcoded
 * string or template literal, which would ship untranslated to every non-English
 * locale. Adapted for this repo's `t('key')` convention from playtomic-admin's
 * `requires-aria-label-i18n` rule.
 *
 * Valid:   aria-label={t('equipment.move.title')}
 *          aria-label={label}                      // trusts a variable
 *          aria-label={row.label}                  // trusts a member access
 *          aria-label={cond ? t('a') : t('b')}     // both branches translated
 * Invalid: aria-label="Close"
 *          aria-label={`User ${i}`}                // use t('user', { i })
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require JSX aria-label values to be translated via t()',
      recommended: true,
    },
    schema: [],
    messages: {
      requireI18n:
        "aria-label must be translated: use t('...') from useLocalization, not a hardcoded string.",
    },
  },
  create(context) {
    /**
     * Reports unless the expression is (or resolves through) a valid translated
     * value. Recurses into the branches of `||` and `?:` so a single bad branch
     * is still caught.
     * @param {import('estree').Node} expression
     */
    function checkExpression(expression) {
      // t('key') — the translator call. Valid.
      if (
        expression.type === 'CallExpression' &&
        expression.callee.type === 'Identifier' &&
        expression.callee.name === 't'
      ) {
        return;
      }

      // A bare variable or member access — trust it holds an already-translated
      // string (we can't see its origin, and flagging it would be noise).
      if (expression.type === 'Identifier' || expression.type === 'MemberExpression') {
        return;
      }

      // a || b — both sides must be valid.
      if (expression.type === 'LogicalExpression') {
        checkExpression(expression.left);
        checkExpression(expression.right);
        return;
      }

      // cond ? a : b — both branches must be valid.
      if (expression.type === 'ConditionalExpression') {
        checkExpression(expression.consequent);
        checkExpression(expression.alternate);
        return;
      }

      // String literals, template literals, concatenations, etc. are static text.
      context.report({ node: expression, messageId: 'requireI18n' });
    }

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'aria-label') return;

        const value = node.value;
        if (!value) return; // valueless aria-label — not our concern.

        // aria-label="literal"
        if (value.type === 'Literal') {
          context.report({ node, messageId: 'requireI18n' });
          return;
        }

        // aria-label={ ... }
        if (
          value.type === 'JSXExpressionContainer' &&
          value.expression &&
          value.expression.type !== 'JSXEmptyExpression'
        ) {
          checkExpression(value.expression);
        }
      },
    };
  },
};

export default rule;
