// Commit message conventions for this repo.
//
// We intentionally do NOT extend @commitlint/config-conventional: this
// repo uses plain-sentence commit subjects (e.g. "Localization strictly
// typed."), not Conventional Commits ("feat(scope): ...").
//
// The two enforced rules are checked against the whole header rather than
// the parsed `subject`, because commitlint's `subject-*` rules silently
// pass on non-Conventional messages (the parser leaves `subject` null when
// there is no `type:` prefix). Merge/revert/fixup commits are skipped by
// commitlint's built-in default ignores.

const startsWithUppercase = {
  rules: {
    'header-start-uppercase': ({ header }) => {
      const first = (header ?? '').trimStart().charAt(0);
      const ok =
        first !== '' &&
        first === first.toUpperCase() &&
        first !== first.toLowerCase();
      return [ok, 'commit subject must start with an uppercase letter'];
    },
  },
};

export default {
  plugins: [startsWithUppercase],
  rules: {
    // Subject must end with a period.
    'header-full-stop': [2, 'always', '.'],
    // Subject must start with an uppercase letter.
    'header-start-uppercase': [2, 'always'],
  },
};
