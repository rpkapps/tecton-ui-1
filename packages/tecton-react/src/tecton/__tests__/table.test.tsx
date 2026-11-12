import { readFileSync } from "node:fs"
import path from "node:path"
import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { compile } from "tailwindcss"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/table"

/**
 * The size and stripe classes respond to the table's `data-size` /
 * `data-striped`, so the class lists alone do not change: these tests
 * compile the classes the table renders with Tailwind and let jsdom's
 * cascade say what applies. The theme values are stand-ins, inlined so
 * that computed styles show them.
 */
const THEME = `@theme inline {
  --spacing: 4px;
  --text-xs: 12px;
  --text-sm: 14px;
  --color-surface-alt: rgb(1, 1, 1);
  --color-table-active: rgb(2, 2, 2);
  --color-accent: rgb(3, 3, 3);
  --color-muted: rgb(4, 4, 4);
  --color-table-header: rgb(5, 5, 5);
  --font-weight-normal: 400;
  --font-weight-medium: 500;
}`

const STRIPE = "rgb(1, 1, 1)"
const SELECTED = "rgb(2, 2, 2)"
const HOVER = "rgb(3, 3, 3)"
const PLAIN = "rgba(0, 0, 0, 0)"

/**
 * The vendored shadcn stylesheet's variants, as an application compiles
 * them: `data-selected:` is `:where([data-selected="true"])`, which weighs
 * no more than the stripe.
 */
const SHADCN_CSS = readFileSync(
  path.join(import.meta.dirname, "../../styles/shadcn.css"),
  "utf8"
)

/**
 * The CSS of every class in the document. jsdom has no hover state, so
 * `:hover` is written as `[data-hover]` (the same specificity: a
 * pseudo-class weighs as an attribute), out of its `@media (hover: hover)`.
 */
async function applyStyles() {
  const classes = new Set<string>()
  for (const element of document.body.querySelectorAll("*"))
    for (const name of element.classList) classes.add(name)
  const compiler = await compile(
    `${THEME}\n${SHADCN_CSS}\n@tailwind utilities;`
  )
  const css = compiler
    .build([...classes])
    .replace(/@media \(hover: hover\) \{([\s\S]*?\})\s*\}/g, "$1")
    .replaceAll(":hover", "[data-hover]")
  const style = document.createElement("style")
  style.dataset.testid = "tailwind"
  style.textContent = css
  document.head.append(style)
}

afterEach(() => {
  document.head.querySelector('style[data-testid="tailwind"]')?.remove()
  vi.restoreAllMocks()
})

const WELLS = ["34/10-A-12", "34/10-A-14", "34/10-B-03", "Gullfaks C-07"]

function Wells(props: React.ComponentProps<typeof Table>) {
  return (
    <Table aria-label="Wells" {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Well</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {WELLS.map((well) => (
          <TableRow key={well}>
            <TableCell>{well}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Average</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

const row = (text: string) =>
  screen.getByText(text).closest("tr") as HTMLTableRowElement
const background = (element: Element) =>
  getComputedStyle(element).backgroundColor
/** A computed length, `calc(16px)` read as `16px`. */
const length = (element: Element, property: string) =>
  getComputedStyle(element)
    .getPropertyValue(property)
    .replace(/^calc\((.*)\)$/, "$1")

describe("Table size", () => {
  it("is default unless set, as data-size", () => {
    const { rerender } = render(<Wells />)
    expect(screen.getByRole("table")).toHaveAttribute("data-size", "default")
    rerender(<Wells size="sm" />)
    expect(screen.getByRole("table")).toHaveAttribute("data-size", "sm")
  })

  it("keeps the default header height, padding and text", async () => {
    render(<Wells />)
    await applyStyles()
    expect(length(screen.getByRole("table"), "font-size")).toBe("14px")
    expect(length(screen.getByText("Well"), "height")).toBe("48px")
    const cell = screen.getByText("34/10-A-12")
    expect(length(cell, "padding-block")).toBe("12px")
    expect(length(cell, "padding-inline")).toBe("16px")
  })

  it("sm is compact: a shorter header and rows, smaller text, the same sides", async () => {
    render(<Wells size="sm" />)
    await applyStyles()
    expect(length(screen.getByRole("table"), "font-size")).toBe("12px")
    const header = screen.getByText("Well")
    expect(length(header, "height")).toBe("32px")
    expect(length(header, "padding-inline")).toBe("16px")
    const cell = screen.getByText("34/10-A-12")
    expect(length(cell, "padding-block")).toBe("4px")
    expect(length(cell, "padding-inline")).toBe("16px")
    // The footer's cells are compact too.
    expect(length(screen.getByText("Total"), "padding-block")).toBe("4px")
  })

  /** A table of wells in a cell of a table of fields. */
  function Nested({
    outer,
    inner,
  }: {
    outer: "default" | "sm"
    inner: "default" | "sm"
  }) {
    return (
      <Table aria-label="Fields" size={outer}>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Table aria-label="Wells" size={inner}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Well</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>34/10-A-12</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  it("leaves a default table inside an sm one at the default size", async () => {
    render(<Nested outer="sm" inner="default" />)
    await applyStyles()
    const outer = screen.getByRole("table", { name: "Fields" })
    expect(length(outer, "font-size")).toBe("12px")
    expect(length(screen.getByText("Field"), "height")).toBe("32px")
    expect(
      length(screen.getByText("Well").closest("table")!, "font-size")
    ).toBe("14px")
    expect(length(screen.getByText("Well"), "height")).toBe("48px")
    expect(length(screen.getByText("34/10-A-12"), "padding-block")).toBe("12px")
  })

  it("makes an sm table inside a default one compact", async () => {
    render(<Nested outer="default" inner="sm" />)
    await applyStyles()
    const outer = screen.getByRole("table", { name: "Fields" })
    expect(length(outer, "font-size")).toBe("14px")
    expect(length(screen.getByText("Field"), "height")).toBe("48px")
    expect(
      length(screen.getByText("Well").closest("table")!, "font-size")
    ).toBe("12px")
    expect(length(screen.getByText("Well"), "height")).toBe("32px")
    expect(length(screen.getByText("34/10-A-12"), "padding-block")).toBe("4px")
  })
})

describe("Table row header", () => {
  function Named({ size }: { size?: "default" | "sm" }) {
    return (
      <Table aria-label="Wells" size={size}>
        <TableHeader>
          <TableRow>
            <TableHead>Well</TableHead>
            <TableHead>Field</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">34/10-A-12</TableHead>
            <TableCell>Gullfaks</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  it("looks like the row's cells: their padding, weight and background", async () => {
    render(<Named />)
    await applyStyles()
    const header = screen.getByText("34/10-A-12")
    const cell = screen.getByText("Gullfaks")
    expect(length(header, "padding-block")).toBe(length(cell, "padding-block"))
    expect(length(header, "padding-inline")).toBe("16px")
    expect(getComputedStyle(header).fontWeight).toBe("400")
    expect(background(header)).toBe(PLAIN)
    expect(length(header, "height")).toBe("auto")
    // The column headers keep theirs.
    expect(background(screen.getByText("Well"))).toBe("rgb(5, 5, 5)")
  })

  it("is compact with the cells at sm", async () => {
    render(<Named size="sm" />)
    await applyStyles()
    expect(length(screen.getByText("34/10-A-12"), "padding-block")).toBe("4px")
    expect(length(screen.getByText("34/10-A-12"), "height")).toBe("auto")
  })
})

describe("Table striped", () => {
  it("is off unless set, as data-striped", () => {
    const { rerender } = render(<Wells />)
    expect(screen.getByRole("table")).not.toHaveAttribute("data-striped")
    rerender(<Wells striped />)
    expect(screen.getByRole("table")).toHaveAttribute("data-striped", "")
  })

  it("puts every even body row on the alternate surface", async () => {
    render(<Wells striped />)
    await applyStyles()
    expect(WELLS.map((well) => background(row(well)))).toEqual([
      PLAIN,
      STRIPE,
      PLAIN,
      STRIPE,
    ])
    // Neither the header nor the footer.
    expect(background(row("Well"))).toBe(PLAIN)
    expect(background(row("Average"))).toBe(PLAIN)
  })

  it("leaves the rows plain without striped", async () => {
    render(<Wells />)
    await applyStyles()
    for (const well of WELLS) expect(background(row(well))).toBe(PLAIN)
  })

  it("gives way to the hover and selected fills", async () => {
    render(<Wells striped />)
    await applyStyles()
    const striped = row("34/10-A-14")
    striped.setAttribute("data-hover", "")
    expect(background(striped)).toBe(HOVER)
    striped.removeAttribute("data-hover")
    striped.setAttribute("data-selected", "true")
    expect(background(striped)).toBe(SELECTED)
    striped.removeAttribute("data-selected")
    striped.setAttribute("data-state", "selected")
    expect(background(striped)).toBe(SELECTED)
  })

  it("fills a selected row the same whatever its stripe, and hover over both", async () => {
    render(<Wells striped />)
    await applyStyles()
    const rows = WELLS.map(row)
    for (const tr of rows) tr.setAttribute("data-selected", "true")
    expect(rows.map(background)).toEqual(rows.map(() => SELECTED))
    for (const tr of rows) {
      tr.setAttribute("data-hover", "")
      expect(background(tr)).toBe(HOVER)
      tr.removeAttribute("data-hover")
    }
    // Hover wins over the stripe of an unselected row too.
    for (const tr of rows) tr.removeAttribute("data-selected")
    rows[1].setAttribute("data-hover", "")
    expect(background(rows[1])).toBe(HOVER)
  })

  it("stripes only its own rows, not a table inside one", async () => {
    render(
      <Table aria-label="Fields" striped>
        <TableBody>
          <TableRow>
            <TableCell>Gullfaks</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Table aria-label="Wells">
                <TableBody>
                  <TableRow>
                    <TableCell>34/10-A-12</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>34/10-A-14</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    await applyStyles()
    expect(background(row("34/10-A-12").parentElement!.closest("tr")!)).toBe(
      STRIPE
    )
    expect(background(row("34/10-A-14"))).toBe(PLAIN)
  })
})

describe("Table striped and virtualized", () => {
  const ROW = 40
  const HEADER = 40
  const VIEW = 400
  const MANY = Array.from({ length: 1_000 }, (_, i) => `Well ${i}`)

  function layout() {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(VIEW)
    const originalRect = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const box = (top: number, height: number) =>
          ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON() {},
          }) as DOMRect
        const index = (this as HTMLElement).dataset.index
        if (["THEAD", "TABLE", "TH"].includes(this.tagName))
          return box(0, HEADER)
        if (this.tagName === "TR" && index !== undefined)
          return box(HEADER + Number(index) * ROW, ROW)
        return originalRect.call(this)
      }
    )
  }

  function scrollTo(top: number) {
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    Object.defineProperty(container, "scrollTop", {
      configurable: true,
      value: top,
    })
    fireEvent.scroll(container)
  }

  const rendered = () =>
    Array.from(
      document.querySelectorAll<HTMLTableRowElement>("tbody tr[data-index]")
    )

  it("keeps each row on its stripe whichever rows are mounted", async () => {
    layout()
    render(
      <div style={{ height: VIEW }}>
        <Table aria-label="Wells" virtualized striped>
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody items={MANY}>
            {(well) => (
              <TableRow key={well}>
                <TableCell>{well}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
    await applyStyles()
    // Scrolled by an odd and then an even number of rows: the first row
    // mounted changes parity, its stripe does not.
    for (const rows of [0, 301, 500]) {
      scrollTo(HEADER + rows * ROW)
      const mounted = rendered()
      expect(mounted.length).toBeGreaterThan(5)
      for (const element of mounted)
        expect([element.dataset.index, background(element)]).toEqual([
          element.dataset.index,
          Number(element.dataset.index) % 2 === 1 ? STRIPE : PLAIN,
        ])
    }
  })
})
