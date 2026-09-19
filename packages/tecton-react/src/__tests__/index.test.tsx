import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import * as barrel from "../index"
import {
  Button,
  Panel,
  PanelHeader,
  PanelTitle,
  cn,
  useIsMobile,
} from "../index"

/**
 * Every module the barrel is generated from (scripts/barrel-build.mts keeps
 * the same four directories). Loaded eagerly so the runtime export names can
 * be compared with the barrel's — a `shadcn add` that introduces a new export
 * fails here as well as in `pnpm barrel:check`.
 */
const modules: Record<string, Record<string, unknown>> = {
  ...import.meta.glob("../components/*.tsx", { eager: true }),
  ...import.meta.glob("../hooks/*.ts", { eager: true }),
  ...import.meta.glob("../lib/*.ts", { eager: true }),
  ...import.meta.glob("../tecton/*.tsx", { eager: true }),
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
})
