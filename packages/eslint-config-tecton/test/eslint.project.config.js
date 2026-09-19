import tsParser from "@typescript-eslint/parser"

import tecton from "../index.js"

/** `project`: the only preset that also reports the application's own markup. */
export default [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...tecton.configs.project,
]
