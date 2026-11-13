import { describe, expect, it } from "vitest"

import { libraryNameErrors } from "../guidelines-lib.mjs"

const PROHIBITION =
  "Nothing is imported from `react-aria-components` or `@base-ui/react`."
const WRONG_BLOCK = [
  "Wrong:",
  "",
  "```tsx",
  'import { Dialog } from "@base-ui/react/dialog"',
  "```",
].join("\n")

describe("libraryNameErrors", () => {
  it("rejects a library name anywhere consumers read, even in a prohibition", () => {
    expect(libraryNameErrors(PROHIBITION, "topics/rules.md")).toHaveLength(2)
    expect(
      libraryNameErrors(WRONG_BLOCK, "topics/conventions.md")
    ).toHaveLength(1)
    expect(
      libraryNameErrors("Built on Base UI.", "families.json")
    ).toHaveLength(1)
  })

  it("lets the skill spell the package in an import prohibition only", () => {
    const skill = { allowProhibitions: true }
    expect(
      libraryNameErrors(PROHIBITION, "skills/tecton/SKILL.md", skill)
    ).toEqual([])
    expect(
      libraryNameErrors(WRONG_BLOCK, "skills/tecton/SKILL.md", skill)
    ).toEqual([])
    expect(
      libraryNameErrors("Built on Base UI.", "skills/tecton/SKILL.md", skill)
    ).toHaveLength(1)
  })

  it("passes guidance that names only Tecton", () => {
    expect(
      libraryNameErrors(
        "Import `DialogContentProps` from `@tecton/react/dialog`.",
        "x"
      )
    ).toEqual([])
  })
})
