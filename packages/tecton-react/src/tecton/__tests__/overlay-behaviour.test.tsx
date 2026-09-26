import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Calendar } from "@tecton/react/components/calendar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@tecton/react/components/pagination"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

// Behaviour the overlay patch (scripts/registry-mirror/overlay/tecton.patch)
// fixes in the generated components; see docs/UPSTREAM.md, "Overlay hunks".

describe("calendar", () => {
  function Controlled() {
    const [date, setDate] = React.useState<Date | undefined>(
      new Date(2026, 8, 15)
    )
    return (
      <Calendar
        mode="single"
        month={new Date(2026, 8, 1)}
        selected={date}
        onSelect={setDate}
      />
    )
  }
  const day = (n: number) =>
    screen.getAllByRole("button").find((b) => b.textContent === String(n))!

  it("keeps the day buttons mounted when the selection changes", () => {
    render(<Controlled />)
    const tenth = day(10)
    fireEvent.click(tenth)
    expect(tenth.isConnected).toBe(true)
    expect(day(10)).toBe(tenth)
  })

  it("moves DOM focus with the arrow keys", () => {
    render(<Controlled />)
    const fifteenth = day(15)
    act(() => fifteenth.focus())
    fireEvent.keyDown(fifteenth, { key: "ArrowRight" })
    expect(document.activeElement).toBe(day(16))
  })
})

describe("pagination", () => {
  it("renders page links as links, not buttons", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("tabs", () => {
  it("passes a vertical orientation to the tab list", () => {
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    )
  })
})
