import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderNav,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

describe("PageHeader", () => {
  it("composes the title block", () => {
    const { container } = render(
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Wells / North Sea</PageHeaderEyebrow>
          <PageHeaderTitle>34/10-A-12</PageHeaderTitle>
          <PageHeaderDescription>Exploration well</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderNav aria-label="Sections">
          <a href="#a">Overview</a>
        </PageHeaderNav>
      </PageHeader>
    )
    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-slot",
      "page-header"
    )
    expect(
      container.querySelector('[data-slot="page-header-content"]')
    ).toBeInTheDocument()
    expect(screen.getByText("Wells / North Sea")).toHaveAttribute(
      "data-slot",
      "page-header-eyebrow"
    )
    expect(
      screen.getByRole("heading", { level: 1, name: "34/10-A-12" })
    ).toHaveAttribute("data-slot", "page-header-title")
    expect(screen.getByText("Exploration well")).toHaveAttribute(
      "data-slot",
      "page-header-description"
    )
    expect(
      screen.getByRole("navigation", { name: "Sections" })
    ).toHaveAttribute("data-slot", "page-header-nav")
  })

  it("renders the actions as an overflow row", () => {
    const { container } = render(
      <PageHeader>
        <PageHeaderActions>
          <button>Edit</button>
        </PageHeaderActions>
      </PageHeader>
    )
    const actions = container.querySelector('[data-slot="page-header-actions"]')
    expect(actions).toHaveAttribute("data-overflow-root")
    expect(actions).toContainElement(
      screen.getByRole("button", { name: "Edit" })
    )
  })

  it("merges className on each part", () => {
    const { container } = render(
      <PageHeader className="a">
        <PageHeaderContent className="b">
          <PageHeaderEyebrow className="c" />
          <PageHeaderTitle className="d" />
          <PageHeaderDescription className="e" />
        </PageHeaderContent>
        <PageHeaderNav className="f" />
        <PageHeaderActions className="g" />
      </PageHeader>
    )
    const cls = (slot: string) =>
      container.querySelector(`[data-slot="${slot}"]`)
    expect(cls("page-header")).toHaveClass("a")
    expect(cls("page-header-content")).toHaveClass("b")
    expect(cls("page-header-eyebrow")).toHaveClass("c")
    expect(cls("page-header-title")).toHaveClass("d")
    expect(cls("page-header-description")).toHaveClass("e")
    expect(cls("page-header-nav")).toHaveClass("f")
    expect(cls("page-header-actions")).toHaveClass("g")
  })
})
