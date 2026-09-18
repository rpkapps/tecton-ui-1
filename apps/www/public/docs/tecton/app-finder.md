# App Finder

Application switcher for the shell header: a compact badge for the current app and a searchable, category-grouped palette of every registered application.

Source: /docs/tecton/app-finder.md  
React Aria docs: https://react-aria.adobe.com/Autocomplete

**Example — `app-finder-demo`**

```tsx
import * as React from "react"

import {
  AppFinder,
  AppFinderGroup,
  AppFinderInput,
  AppFinderItem,
  AppFinderList,
  AppFinderMenu,
  AppFinderTrigger,
  type AppFinderTone,
} from "@tecton/react/tecton/app-finder"

const catalogue: {
  category: string
  tone: AppFinderTone
  apps: { id: string; code: string; name: string; description: string }[]
}[] = [
  {
    category: "Subsurface",
    tone: "blue",
    apps: [
      {
        id: "dsg",
        code: "DSG",
        name: "Discovery",
        description: "Regional geology and prospects",
      },
      {
        id: "fwm",
        code: "FWM",
        name: "Framework Modeling",
        description: "Horizons and faults",
      },
      {
        id: "wcr",
        code: "WCR",
        name: "Well Correlation",
        description: "Log correlation and markers",
      },
    ],
  },
  {
    category: "Wells",
    tone: "green",
    apps: [
      {
        id: "dwp",
        code: "DWP",
        name: "Well Planning",
        description: "Well design and comparison",
      },
      {
        id: "trj",
        code: "TRJ",
        name: "Trajectory Design",
        description: "Targets and anti-collision",
      },
    ],
  },
  {
    category: "Facilities",
    tone: "saffron",
    apps: [
      {
        id: "aam",
        code: "AAM",
        name: "Asset Management",
        description: "Field development alternatives",
      },
      {
        id: "sub",
        code: "SUB",
        name: "Subsea Layout",
        description: "Templates, flowlines, umbilicals",
      },
    ],
  },
]

const allApps = catalogue.flatMap((group) =>
  group.apps.map((app) => ({ ...app, tone: group.tone }))
)

export default function AppFinderDemo() {
  const [current, setCurrent] = React.useState(allApps[0])

  return (
    <AppFinder>
      <AppFinderTrigger name={current.name} tone={current.tone}>
        {current.code}
      </AppFinderTrigger>
      <AppFinderMenu>
        <AppFinderInput />
        <AppFinderList
          onAction={(key) => {
            const app = allApps.find((item) => item.id === key)
            if (app) setCurrent(app)
          }}
        >
          {catalogue.map((group) => (
            <AppFinderGroup key={group.category} heading={group.category}>
              {group.apps.map((app) => (
                <AppFinderItem
                  key={app.id}
                  id={app.id}
                  icon={app.code}
                  tone={group.tone}
                  name={app.name}
                  description={app.description}
                  keywords={[app.code, group.category]}
                  isCurrent={app.id === current.id}
                />
              ))}
            </AppFinderGroup>
          ))}
        </AppFinderList>
      </AppFinderMenu>
    </AppFinder>
  )
}
```

## Usage

```tsx
import {
  AppFinder,
  AppFinderTrigger,
  AppFinderMenu,
  AppFinderInput,
  AppFinderList,
  AppFinderGroup,
  AppFinderItem,
} from "@tecton/react/tecton/app-finder"
```

```tsx
<AppFinder>
  <AppFinderTrigger name="Well Planning" tone="green">
    DWP
  </AppFinderTrigger>
  <AppFinderMenu>
    <AppFinderInput />
    <AppFinderList onAction={(key) => navigateTo(String(key))}>
      <AppFinderGroup heading="Recent" hideWhileSearching>
        <AppFinderItem id="recent-dsg" icon="DSG" tone="blue" name="Discovery" />
      </AppFinderGroup>
      <AppFinderGroup heading="Subsurface">
        <AppFinderItem id="dsg" icon="DSG" tone="blue" name="Discovery" description="Regional geology" keywords={["DSG"]} />
      </AppFinderGroup>
      <AppFinderGroup heading="Wells">
        <AppFinderItem id="dwp" icon="DWP" tone="green" name="Well Planning" keywords={["DWP"]} isCurrent />
      </AppFinderGroup>
    </AppFinderList>
  </AppFinderMenu>
</AppFinder>
```

> The app finder is owned by the micro-frontend host and replaces the static brand in `AppShellBrand`. It is built on [Command](/docs/components/command.md) inside a popover: typing filters every group at once and highlights the match, arrow keys move through the results, and the list scrolls, so a catalogue of a hundred applications stays usable. Group by category, give each category a `tone` so the tiles carry the app's identity, and put a "Recent" or "Favourites" group first with `hideWhileSearching`.

## Composition

```text
AppFinder
├── AppFinderTrigger
└── AppFinderMenu
    ├── AppFinderInput
    └── AppFinderList
        └── AppFinderGroup (heading)
            └── AppFinderItem …
```

## Large catalogues

Keep item ids unique across groups: an app listed under both "Recent" and its category needs two ids (`recent-dwp` and `dwp`). Mark the "Recent" group `hideWhileSearching` so a query lists each app once, and leave the current app out of it. Pass the short code and the category name in `keywords` so a search for either finds the app. The list is capped at 24 rem or 60 % of the viewport and scrolls; the filter runs on the client, which is fine for a few hundred entries.

## Tones

`AppFinderTrigger` and `AppFinderItem` take a `tone` that colours the code tile from the Tecton palette: `neutral` (default), `blue`, `azure`, `green`, `lime`, `yellow`, `saffron`, `red`, `pink`, `orchid`, `mauve`, `violet` or `lilac`. Assign one tone per category so a user scanning the list can find a family by colour. `AppFinderIcon` renders the same tile on its own, for a command palette or a launcher grid.

## API Reference

### AppFinder

React Aria `DialogTrigger`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` / `onOpenChange` | `boolean` / `(open: boolean) => void` | - | Controlled open state. |

### AppFinderTrigger

Ghost `Button` showing the current app's tile, its name from `sm` up, and a chevron.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | The short code of the current app, shown in the tile. |
| `name` | `string` | - | Name of the current app; shown next to the tile on wider screens and used for the default `aria-label`. |
| `tone` | `AppFinderTone` | "neutral" | Colour of the tile. |
| `aria-label` | `string` | "Switch application, current: {name}" | Override the accessible name. |

### AppFinderMenu

Popover anchored bottom-start, 26 rem wide, wrapping a `Command`. The query resets every time the menu opens.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | `string` | "Applications" | Accessible name of the palette. |
| `placement` | `Placement` | "bottom start" | Popover placement. |

### AppFinderInput

`CommandInput`; autofocuses when the menu opens.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | "Search applications…" |  |

### AppFinderList

`CommandList` that closes the menu after a choice.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onAction` | `(key: Key) => void` | - | Called with the `id` of the chosen app. |
| `emptyMessage` | `ReactNode` | "No applications match" | Shown when the filter matches nothing. |
| `emptyHint` | `ReactNode` | "Try the app's short code or its category" | Second line of the empty state; pass `null` to drop it. |

### AppFinderGroup

`CommandGroup` with a hairline above every group but the first.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | - | Category label. |
| `hideWhileSearching` | `boolean` | false | Leave the group out while a query is typed (for "Recent" or "Favourites"). |

### AppFinderItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `Key` | - | Unique key passed to `onAction`. |
| `name` | `string` | - | Display name; part of the filter text. |
| `description` | `ReactNode` | - | Secondary line. |
| `icon` | `ReactNode` | - | Glyph or short code in the leading tile. |
| `tone` | `AppFinderTone` | "neutral" | Colour of the tile. |
| `keywords` | `string[]` | - | Extra words the filter matches (short code, category, aliases). |
| `isCurrent` | `boolean` | false | Marks the mounted app with a "Current" check and `data-current`. |

### AppFinderIcon

The tile on its own: a `span` with `tone` and `size` (`sm` for the trigger, `default` for items).
