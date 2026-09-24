//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
      // shadcn conventions used by the generated components and followed by
      // the Tecton components and examples: inline `type` import specifiers
      // and `composeRenderProps(className, (className) => …)`.
      "import/consistent-type-specifier-style": "off",
      "no-shadow": "off",
    },
  },
  {
    // CLI-generated shadcn files (see docs/UPSTREAM.md) and the registry build
    // output are never edited by hand, so they are not linted or formatted
    // either (see also .prettierignore at the repository root).
    ignores: [
      "eslint.config.js",
      ".prettierrc",
      "src/components/**",
      "src/hooks/**",
      "src/lib/**",
      "registry/**",
      "dist/**",
      "agent-eval/.runs/**",
      "agent-eval/results/**",
    ],
  },
]
