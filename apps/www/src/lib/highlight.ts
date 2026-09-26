import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

/** Well above the largest source the docs show (r/theme.json, ~85 kB). */
const MAX_CODE_LENGTH = 200_000

const highlightInput = z.object({
  code: z.string().max(MAX_CODE_LENGTH),
  // A language id or alias; unknown ones are highlighted as plain text.
  lang: z.string().regex(/^[\w#+.-]{1,32}$/),
})

// shiki lives only in the server bundle: the handler body is stripped from the
// client build. Output uses dual themes so `.dark` switches via CSS variables.
// Lines get `data-line` so the docs stylesheet treats them like MDX fences.
export const highlightCode = createServerFn({ method: "POST" })
  .validator(highlightInput)
  .handler(async ({ data }) => {
    const { bundledLanguages, codeToHtml } = await import("shiki")
    const lang = Object.hasOwn(bundledLanguages, data.lang) ? data.lang : "text"
    return codeToHtml(data.code, {
      lang,
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      transformers: [
        {
          pre(node) {
            node.properties["data-language"] = lang
          },
          code(node) {
            node.properties["data-language"] = lang
          },
          line(node) {
            node.properties["data-line"] = ""
          },
        },
      ],
    })
  })
