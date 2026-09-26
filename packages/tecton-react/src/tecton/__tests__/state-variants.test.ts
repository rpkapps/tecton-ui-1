import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

// Tecton parts expose `data-selected` as a presence attribute (`""`), but the
// `data-selected` custom variant in `shadcn/tailwind.css` only matches
// `[data-selected="true"]` (cmdk's command items). A `data-selected:` class
// on a Tecton part therefore never applies; `data-[selected]:` does.

const TECTON_DIR = path.join(import.meta.dirname, "..")

describe("presence state variants", () => {
  it("style data-selected with data-[selected]:, never data-selected:", () => {
    const offenders = readdirSync(TECTON_DIR)
      .filter((file) => file.endsWith(".tsx"))
      .flatMap((file) =>
        [
          ...readFileSync(path.join(TECTON_DIR, file), "utf8").matchAll(
            /(?:^|[\s"'`])(?:(?:group|peer)-)?data-selected[:/][\w/-]*/g
          ),
        ].map((match) => `${file}: ${match[0].trim()}`)
      )
    expect(offenders).toEqual([])
  })
})
