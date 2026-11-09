/** Ten colour scale dropdowns, shared by the docs route and the standalone mockup build. */
import { Badge } from "@tecton/react/components/badge"
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

import DropdownChip from "./d01-chip"
import DropdownGradientOnly from "./d02-gradient-only"
import DropdownNameOnGradient from "./d03-name-on-gradient"
import DropdownUnderline from "./d04-underline"
import DropdownTileGrid from "./d05-tile-grid"
import DropdownSearch from "./d06-search"
import DropdownTabbed from "./d07-tabbed"
import DropdownCascading from "./d08-cascading"
import DropdownPreviewPane from "./d09-preview-pane"
import DropdownSplitButton from "./d10-split-button"
import { DropdownCard } from "./parts"

const variations = [
  {
    title: "Chip + name",
    description:
      "A small gradient chip beside the name, in the field and every option.",
    Component: DropdownChip,
  },
  {
    title: "Gradient only",
    description:
      "The gradient fills the field; each option is its name over a full-width strip.",
    Component: DropdownGradientOnly,
  },
  {
    title: "Name on gradient",
    description:
      "The gradient fills the field and each option, with the name on a small label.",
    Component: DropdownNameOnGradient,
  },
  {
    title: "Underline",
    description:
      "The name leads; a thin gradient rule underneath carries the colour.",
    Component: DropdownUnderline,
  },
  {
    title: "Tile grid",
    description:
      "A swatch-sized button for tight toolbars, opening a 4 × 4 grid of tiles.",
    Component: DropdownTileGrid,
  },
  {
    title: "Searchable",
    description:
      "Type to narrow by name, family or “safe” for colour-blind-safe scales.",
    Component: DropdownSearch,
  },
  {
    title: "Tabbed",
    description:
      "Family tabs inside the dropdown keep each list to three to five scales.",
    Component: DropdownTabbed,
  },
  {
    title: "Cascading menu",
    description:
      "Three recent scales on top, each family a submenu, Reverse at the foot.",
    Component: DropdownCascading,
  },
  {
    title: "List + preview",
    description:
      "Pointing at a scale draws it on the section in a pane beside the list.",
    Component: DropdownPreviewPane,
  },
  {
    title: "Split button",
    description:
      "One click flips back to the previous scale for A/B checks; the chevron opens the list.",
    Component: DropdownSplitButton,
  },
]

/** The exploration page: header and the ten dropdowns. */
export default function ColorScaleExploration() {
  return (
    <div className="flex flex-col">
      <PageHeader className="py-8 md:py-10">
        <PageHeaderContent>
          <PageHeaderEyebrow>
            <Badge variant="outline">Exploration</Badge>
          </PageHeaderEyebrow>
          <PageHeaderTitle className="whitespace-normal">
            Colour scale dropdown
          </PageHeaderTitle>
          <PageHeaderDescription>
            Ten dropdowns for picking the colour scale of a resistivity
            inversion from fourteen presets, built from Tecton components. Open
            each one to compare the lists.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <div className="grid gap-4 pb-16 sm:grid-cols-2 xl:grid-cols-5">
        {variations.map(({ Component, ...v }, i) => (
          <DropdownCard key={v.title} index={i + 1} {...v}>
            <Component />
          </DropdownCard>
        ))}
      </div>
    </div>
  )
}
