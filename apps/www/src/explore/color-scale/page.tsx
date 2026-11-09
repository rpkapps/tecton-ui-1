/** Ten ways to pick a colour scale, shared by the docs route and the standalone mockup build. */
import { Badge } from "@tecton/react/components/badge"
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

import PickerSelect from "./v01-select"
import PickerCombobox from "./v02-combobox"
import PickerPopoverGrid from "./v03-popover-grid"
import PickerLegendMenu from "./v04-legend-menu"
import PickerQuickSwitch from "./v05-quick-switch"
import PickerRadioCards from "./v06-radio-cards"
import PickerGallery from "./v07-gallery"
import PickerPanelList from "./v08-panel-list"
import PickerStepper from "./v09-stepper"
import PickerDialog from "./v10-dialog"
import { Variation } from "./parts"

const variations = [
  {
    title: "Dropdown",
    description:
      "A Select with the gradient beside each name, grouped by family. The smallest footprint; drops into any form.",
    bestFor: "settings forms, export dialogs",
    Component: PickerSelect,
  },
  {
    title: "Searchable combobox",
    description:
      "Type to narrow the list by name, family or description; colour-blind-safe scales are flagged. The current gradient sits inside the field.",
    bestFor: "long preset catalogues, keyboard users",
    Component: PickerCombobox,
  },
  {
    title: "Popover grid",
    description:
      "A button that shows the current scale opens every preset as a tile, grouped by family, with a reverse switch. One click picks and closes.",
    bestFor: "toolbars and headers with little room",
    Component: PickerPopoverGrid,
  },
  {
    title: "Legend menu",
    description:
      "The colour bar beside the plot is the picker: its header opens a menu of scales with radio check marks and a reverse toggle.",
    bestFor: "plot views where the legend is already on screen",
    Component: PickerLegendMenu,
  },
  {
    title: "Quick switch",
    description:
      "Five favourite scales one click away in a segmented control (names in tooltips), the rest under More, plus Reverse.",
    bestFor: "frequent switching while interpreting",
    Component: PickerQuickSwitch,
  },
  {
    title: "Choice cards",
    description:
      "A short curated list as radio cards, each with its gradient, what it is good for and a colour-blind-safe badge.",
    bestFor: "report and project settings, guiding non-specialists",
    Component: PickerRadioCards,
  },
  {
    title: "Gallery on your data",
    description:
      "Every preset drawn on the current model, by family, with a deuteranopia and greyscale preview, so the choice is made on the picture.",
    bestFor: "choosing a scheme for a publication or a new project",
    Component: PickerGallery,
  },
  {
    title: "Side panel list",
    description:
      "An inspector panel beside the view: search, family filter chips and a scrolling list of rows with gradient, name and note.",
    bestFor: "desktop-style applications with an inspector",
    Component: PickerPanelList,
  },
  {
    title: "Flip-through",
    description:
      "The preview is the picker: step through every scale with the arrows, or jump with the strip of gradients underneath.",
    bestFor: "comparing scales on one picture",
    Component: PickerStepper,
  },
  {
    title: "Dialog with Apply",
    description:
      "A deliberate choice: browse by family, preview the draft beside the list, and nothing changes until Apply; Cancel discards.",
    bestFor: "shared projects where a change affects every section",
    Component: PickerDialog,
  },
]

/** The exploration page: header, jump links and the ten variations. */
export default function ColorScaleExploration() {
  return (
    <div className="flex flex-col">
      <PageHeader className="py-8 md:py-10">
        <PageHeaderContent>
          <PageHeaderEyebrow>
            <Badge variant="outline">Exploration</Badge>
          </PageHeaderEyebrow>
          <PageHeaderTitle className="whitespace-normal">
            Colour scale picker
          </PageHeaderTitle>
          <PageHeaderDescription>
            Ten ways to pick the colour scale of a resistivity inversion from a
            set of presets, built from Tecton components. Every variation paints
            the same synthetic 2-D ERT section (2 – 2k Ω·m, log), so they can be
            compared side by side.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <nav
        aria-label="Variations"
        className="-mt-2 mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm"
      >
        {variations.map((v, i) => (
          <a
            key={v.title}
            href={`#v${i + 1}`}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {String(i + 1).padStart(2, "0")} {v.title}
          </a>
        ))}
      </nav>
      <div className="flex flex-col gap-16 pb-16">
        {variations.map(({ Component, ...v }, i) => (
          <Variation key={v.title} index={i + 1} {...v}>
            <Component />
          </Variation>
        ))}
      </div>
    </div>
  )
}
