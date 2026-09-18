import tsParser from "@typescript-eslint/parser"

import tecton from "../index.js"

/** The shipped preset, exactly as a consumer application would use it. */
export default [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...tecton.configs.recommended,
]
