import tsParser from "@typescript-eslint/parser"

import tecton from "../index.js"

/** `strict`: the scoped rules plus the theme rules, still on Tecton components. */
export default [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...tecton.configs.strict,
]
