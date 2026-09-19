import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import * as barrel from "../index"
import {
  Button,
  Panel,
  PanelHeader,
  PanelTitle,
  WellIcon,
  cn,
  tectonIcons,
  useIsMobile,
} from "../index"

/**
 * Every module the barrel is generated from — the same sources as `SOURCES`
 * in scripts/barrel-build.mts. Loaded eagerly so the runtime export names can
 * be compared with the barrel's: a `shadcn add` or an `icons:build` that
 * introduces a new export fails here as well as in `pnpm barrel:check`.
 *
 * `../icons` is the generated icon barrel, not the glyph files: it is what the
 * barrel re-exports, and it carries the `tectonIcons` gallery arrays too.
 */
const modules: Record<string, Record<string, unknown>> = {
  ...import.meta.glob("../components/*.tsx", { eager: true }),
  ...import.meta.glob("../hooks/*.ts", { eager: true }),
  ...import.meta.glob("../lib/*.ts", { eager: true }),
  ...import.meta.glob("../tecton/*.tsx", { eager: true }),
  ...import.meta.glob("../icons/index.ts", { eager: true }),
}

describe("@tecton/react barrel", () => {
  it("re-exports every runtime binding of every covered module", () => {
    const expected = new Set<string>()
    for (const module of Object.values(modules))
      for (const name of Object.keys(module)) expected.add(name)

    const missing = [...expected].filter((name) => !(name in barrel)).sort()
    expect(missing, "run `pnpm barrel:build`").toEqual([])
  })

  it("exports nothing the covered modules do not", () => {
    const owned = new Set(
      Object.values(modules).flatMap((module) => Object.keys(module))
    )
    const extra = Object.keys(barrel)
      .filter((name) => !owned.has(name))
      .sort()
    expect(extra).toEqual([])
  })

  it("points every name at the binding its own module exports", () => {
    const exported = barrel as unknown as Record<string, unknown>
    const wrong: string[] = []
    for (const [file, module] of Object.entries(modules))
      for (const [name, value] of Object.entries(module))
        if (exported[name] !== value) wrong.push(`${name} (${file})`)

    expect(wrong).toEqual([])
  })

  it("renders a shadcn and a Tecton component through the single entry", () => {
    render(
      <Panel className={cn("w-64")}>
        <PanelHeader>
          <PanelTitle>Well design</PanelTitle>
        </PanelHeader>
        <Button>Save</Button>
      </Panel>
    )

    expect(screen.getByText("Well design")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("exposes hooks through the single entry", () => {
    expect(typeof useIsMobile).toBe("function")
  })

  it("renders an icon through the single entry", () => {
    render(<WellIcon data-testid="glyph" />)

    const glyph = screen.getByTestId("glyph")
    expect(glyph.tagName).toBe("svg")
    expect(glyph).toHaveAttribute("data-tecton-icon", "well")
  })

  it("carries the icon gallery, which stays tree-shakeable", () => {
    // Re-exported here only because dropping it is the bundler's job: the
    // package marks its JS side-effect-free, so an application that never
    // touches `tectonIcons` does not pay for the glyphs it references.
    expect(tectonIcons.length).toBe(131)
    expect(tectonIcons.every((entry) => typeof entry.Icon === "function")).toBe(
      true
    )
  })
})
