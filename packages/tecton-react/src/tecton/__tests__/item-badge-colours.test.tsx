import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge } from "@tecton/react/badge"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/combobox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@tecton/react/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/select"

// A highlighted or focused menu, select or combobox item turns its icons and
// secondary text `accent-foreground` with a descendant (`**:`) text class.
// A `Badge` inside the item keeps its own colours (the power search's coloured
// option values): every such class skips badges and their contents
// (style-tecton.css, docs/UPSTREAM.md "Overlay hunks"). jsdom computes no
// Tailwind, so the class strings are what is tested.

// Class tokens of `element` that recolour its descendants' text.
const descendantTextClasses = (element: Element) =>
  element.className
    .split(/\s+/)
    .filter(
      (token) => /(?:^|:)\*\*:/.test(token) && /:text-[\w-]+$/.test(token)
    )

function expectBadgesSkipped(element: Element) {
  const classes = descendantTextClasses(element)
  // Icons and secondary text still turn accent-foreground.
  expect(classes.length).toBeGreaterThan(0)
  for (const token of classes) {
    expect(token).toContain("not-in-data-[slot=badge]")
    if (!token.includes(":**:[svg]:")) {
      expect(token).toContain("not-data-[slot=badge]")
    }
  }
}

describe("a badge in a highlighted item", () => {
  it("keeps its colours in a combobox item", () => {
    render(
      <Combobox items={["Producing"]} open>
        <ComboboxInput aria-label="Status" />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                <Badge variant="success" appearance="outline">
                  {item}
                </Badge>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
    expectBadgesSkipped(screen.getByRole("option", { name: "Producing" }))
  })

  it("keeps its colours in a dropdown menu item", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Producing <Badge variant="success">3</Badge>
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Shut in</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Injecting</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expectBadgesSkipped(screen.getByRole("menuitem", { name: /Producing/ }))
    expectBadgesSkipped(screen.getByRole("menuitemcheckbox"))
    expectBadgesSkipped(screen.getByRole("menuitemradio"))
  })

  it("keeps its colours in a select item", () => {
    render(
      <Select open value="producing">
        <SelectTrigger aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="producing">Producing</SelectItem>
        </SelectContent>
      </Select>
    )
    expectBadgesSkipped(screen.getByRole("option", { name: "Producing" }))
  })
})
