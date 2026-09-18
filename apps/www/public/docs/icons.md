# Icons

The Tecton icon set (131 icons, outlined and filled) and how it works alongside Lucide.

Source: /docs/icons.md

Tecton UI supports **two icon libraries**:

- **Lucide** (`lucide-react`) — the library the generated shadcn components use internally (chevrons, check marks, close buttons…). It stays the CLI's `iconLibrary`, so generated files never change.
- **Tecton icons** (`@tecton/react/icons`) — the 131 custom icons of the design system, including the domain glyphs (wells, horizons, seismic, drill bits…). Every icon is a React component with the Lucide-compatible signature (`size`, `strokeWidth`, `className`, SVG props) plus `variant="outlined" | "filled"`.

```tsx
import { SearchIcon } from "lucide-react"
import { WellIcon, SeismicIcon } from "@tecton/react/icons"

<Button>
  <WellIcon data-icon="inline-start" /> New well
</Button>
<SeismicIcon variant="filled" size={20} />
```

> **Glyph sources**
>
> The glyphs come from the Tecton icon export vendored in `packages/tecton-react/icons-src/tecton/` (one `defineTectonSvgIcon` definition per icon with outlined and filled markup). `icons:build` generates a React component per definition; every rendered `<svg>` reports its origin through `data-tecton-source` (`svg` for all 131 today). Drop a newer export into that folder and rebuild to update the set.

## Gallery

All 131 icons are exported from `@tecton/react/icons`.

| Import | Glyph | Closest lucide | Domain icon |
| --- | --- | --- | --- |
| `AddIcon` | plus sign | `plus` | — |
| `AddCircleIcon` | circle with plus | `circle-plus` | — |
| `AddPinIcon` | map pin with small plus at top right | `map-pin-plus` | — |
| `AnnotateIcon` | diagonal marker pen | `highlighter` | — |
| `AppsIcon` | 3x3 grid of dots | `grip` | — |
| `ArrowDownIcon` | arrow pointing down | `arrow-down` | — |
| `ArrowLeftIcon` | arrow pointing left | `arrow-left` | — |
| `ArrowRightIcon` | arrow pointing right | `arrow-right` | — |
| `ArrowUpIcon` | arrow pointing up | `arrow-up` | — |
| `CancelCircleIcon` | circle with x | `circle-x` | — |
| `CaretCollapseIcon` | two chevrons pointing toward each other vertically (down over up) | `chevrons-down-up` | — |
| `CaretUpDownIcon` | two chevrons pointing away from each other vertically (up over down) | `chevrons-up-down` | — |
| `CheckIcon` | check mark | `check` | — |
| `CheckboxIcon` | square with check mark | `square-check` | — |
| `CheckboxOutlineBlankIcon` | empty square outline | `square` | — |
| `CheckCircleIcon` | circle with check mark | `circle-check` | — |
| `CheckCircleOpenIcon` | dashed circle with check mark | `circle-dashed` | — |
| `ChevronDownIcon` | chevron pointing down | `chevron-down` | — |
| `ChevronDownSmallIcon` | small chevron pointing down | `chevron-down` | — |
| `ChevronLeftIcon` | chevron pointing left | `chevron-left` | — |
| `ChevronLeftSmallIcon` | small chevron pointing left | `chevron-left` | — |
| `ChevronRightIcon` | chevron pointing right | `chevron-right` | — |
| `ChevronRightSmallIcon` | small chevron pointing right | `chevron-right` | — |
| `ChevronUpIcon` | chevron pointing up | `chevron-up` | — |
| `ChevronUpSmallIcon` | small chevron pointing up | `chevron-up` | — |
| `ChristmasTreeIcon` | wellhead 'christmas tree' valve stack: vertical pipe with stacked crossbars | — | yes |
| `CloseIcon` | x cross | `x` | — |
| `CloseSmallIcon` | small x cross | `x` | — |
| `Co2LeafIcon` | sprout with two leaves | `sprout` | — |
| `CodeIcon` | angle brackets with slash | `code` | — |
| `CollapseContentIcon` | two corner brackets with short arrows pointing inward | `minimize` | — |
| `ControlsIcon` | three horizontal sliders with knobs | `sliders-horizontal` | — |
| `CopyIcon` | two overlapping rounded squares | `copy` | — |
| `CrownIcon` | crown outline | `crown` | — |
| `CubeIcon` | isometric cube outline | `box` | — |
| `DatabaseIcon` | stacked cylinder | `database` | — |
| `DeleteIcon` | trash can | `trash-2` | — |
| `DesignIcon` | crossed pencil and ruler | `pencil-ruler` | — |
| `DiamondMarkIcon` | diamond (rotated square) outline | `diamond` | — |
| `DiscoveryIcon` | compass with needle | `compass` | — |
| `DragIndicatorIcon` | 2x3 grid of dots | `grip-vertical` | — |
| `DrillBitIcon` | drill bit: tapered bit head with shank | — | yes |
| `EditSquareIcon` | square with pencil over top right corner | `square-pen` | — |
| `ElectricityIcon` | lightning bolt | `zap` | — |
| `EngineeringIcon` | drafting compass / divider | `drafting-compass` | — |
| `ErrorIcon` | circle with exclamation mark | `circle-alert` | — |
| `ExpandContentIcon` | two corner brackets with short arrows pointing outward | `expand` | — |
| `ExportUploadIcon` | arrow up out of a tray | `upload` | — |
| `FacilityIcon` | factory / plant building with sawtooth roof and stack | `factory` | — |
| `FaultIcon` | diagonal line with offset crossing segment (geologic fault) | — | yes |
| `FilterIcon` | funnel | `funnel` | — |
| `FolderIcon` | folder outline | `folder` | — |
| `FolderNewIcon` | folder with plus | `folder-plus` | — |
| `FolderOpenIcon` | open folder | `folder-open` | — |
| `FrameworksIcon` | three stacked wavy lines | `waves` | — |
| `GeobodiesIcon` | cluster of three hexagons | — | yes |
| `GeostructureIcon` | irregular hexagon-like blob outline (geologic structure) | — | yes |
| `GridViewIcon` | 2x2 grid of squares | `layout-grid` | — |
| `HistoryIcon` | clock with counter-clockwise arrow | `history` | — |
| `HomeIcon` | house outline | `house` | — |
| `HorizonIcon` | single wave line (seismic horizon) | — | yes |
| `ImageIcon` | picture frame with mountains | `image` | — |
| `IndeterminateCheckboxIcon` | square with minus | `square-minus` | — |
| `InfoIcon` | circle with i | `info` | — |
| `InspectIcon` | scan corners with magnifier in center | `scan-search` | — |
| `KanbanIcon` | square with three vertical bars of different height | `square-kanban` | — |
| `LayersIcon` | two stacked diamonds | `layers` | — |
| `LineWeightIcon` | stacked horizontal bars of increasing thickness | — | — |
| `LinkIcon` | chain link | `link` | — |
| `LinkOffIcon` | chain link with diagonal strike | `unlink` | — |
| `ListIcon` | three bullet lines | `list` | — |
| `LockIcon` | closed padlock | `lock` | — |
| `LockOpenIcon` | open padlock | `lock-open` | — |
| `LogCurveIcon` | vertical zig-zag curve (well log trace) | — | yes |
| `MapIcon` | folded map | `map` | — |
| `MenuIcon` | three horizontal lines | `menu` | — |
| `MicrophoneIcon` | microphone | `mic` | — |
| `MoneyIcon` | dollar sign | `dollar-sign` | — |
| `MoreVertIcon` | three vertical dots | `ellipsis-vertical` | — |
| `NodeIcon` | three circle nodes connected by lines | `waypoints` | — |
| `NotificationsIcon` | bell | `bell` | — |
| `NumericIcon` | hash / number sign | `hash` | — |
| `OilRigOffshoreIcon` | offshore platform: derrick on deck over water | — | yes |
| `OpenInNewIcon` | square with arrow out of top right corner | `square-arrow-out-up-right` | — |
| `PanelIcon` | rectangle with vertical divider toward the right | `panel-right` | — |
| `PanToolIcon` | open hand | `hand` | — |
| `PersonIcon` | person bust | `user` | — |
| `PlayIcon` | right-pointing triangle | `play` | — |
| `PreviewIcon` | eye inside a rounded window | `scan-eye` | — |
| `ProjectIcon` | framed rectangle with angled inner panel | — | — |
| `PulseIcon` | heartbeat / activity line | `activity` | — |
| `RadioButtonIcon` | empty circle | `circle` | — |
| `RedoIcon` | curved arrow to the right | `redo` | — |
| `RemoveIcon` | minus sign | `minus` | — |
| `RemoveCircleIcon` | circle with minus | `circle-minus` | — |
| `ReportsAnalyticsIcon` | bar chart inside a square | `chart-column` | — |
| `RiskSkullIcon` | skull with three list lines to the right | `skull` | — |
| `Robot2Icon` | robot head with eyes and separate body bar | `bot` | — |
| `RockFormationsIcon` | triangle with layered strata lines (rock formations) | — | yes |
| `RotateIcon` | curved arrow around a flat ellipse | `rotate-3d` | — |
| `RulerIcon` | right-triangle set square with tick marks | `ruler` | — |
| `SearchIcon` | magnifying glass | `search` | — |
| `SeismicIcon` | horizontal line over concentric arcs (seismic reflection) | — | yes |
| `SelectIcon` | dashed square outline | `square-dashed` | — |
| `SelectCursorIcon` | mouse pointer arrow | `mouse-pointer` | — |
| `SettingsIcon` | gear | `settings` | — |
| `SliceIcon` | dashed horizontal band between two dotted lines | — | — |
| `SortEnabledIcon` | paired up and down arrows | `arrow-up-down` | — |
| `SplitscreenIcon` | two side-by-side panels with small plus | `columns-2` | — |
| `StrataIcon` | stacked layers with colored (pink-orange gradient) top layer | `layers` | yes |
| `SurfaceIcon` | curved 3D mesh/grid surface | — | yes |
| `SwapIcon` | two horizontal arrows pointing toward each other | `fold-horizontal` | — |
| `TargetIcon` | scan corners with circle in center | `focus` | — |
| `ThreeDIcon` | isometric cube inside scan corners | `box` | — |
| `TrajectoryIcon` | curve from vertical to horizontal (well trajectory) | — | yes |
| `TrendIcon` | rising line chart over bar columns | `chart-no-axes-combined` | — |
| `UndoIcon` | curved arrow to the left | `undo` | — |
| `ValveIcon` | valve symbol: pipe with T-handle stem | — | yes |
| `VelocityModelIcon` | upward arrow through layered arcs (velocity model) | — | yes |
| `ViewColumnIcon` | rectangle split into three vertical columns | `columns-3` | — |
| `ViewModuleIcon` | rectangle split into 3x2 grid of cells | `grid-3x3` | — |
| `VisibilityIcon` | eye | `eye` | — |
| `VisibilityOffIcon` | eye with diagonal strike | `eye-off` | — |
| `WarningIcon` | triangle with exclamation mark | `triangle-alert` | — |
| `WaterIcon` | water droplet | `droplet` | — |
| `WellIcon` | wellhead symbol: vertical line with two short side bars | — | yes |
| `WellPickIcon` | vertical line crossed by a horizontal pick marker with dot | — | yes |
| `WellPlanIcon` | dotted vertical line with wellhead symbol (planned well) | — | yes |
| `WindowIcon` | square split into 2x2 panes | `grid-2x2` | — |
| `ZoomInIcon` | magnifying glass with plus | `zoom-in` | — |
| `ZoomOutIcon` | magnifying glass with minus | `zoom-out` | — |

## Replacing Lucide inside the generated components

If you want the shadcn components to render Tecton glyphs too, alias `lucide-react` to the compatibility module in your bundler. The generated files keep importing `lucide-react`; only the resolution changes:

```ts title="vite.config.ts"
export default defineConfig({
  resolve: {
    alias: {
      "lucide-react": "@tecton/react/icons/lucide-compat",
    },
  },
})
```

The compat module re-exports every Lucide name the components use, mapped to the matching Tecton icon when one exists and to Lucide otherwise.

## Regenerating

```bash
# replace icons-src/tecton/*.ts with a newer Tecton export, then
pnpm --filter @tecton/react icons:build     # regenerates src/icons/*
pnpm --filter @tecton/react icons:build -- --check   # CI drift guard
```

Loose SVG files in `icons-src/outlined/` or `icons-src/filled/` override a definition for that variant (`icons:extract` can populate them from a Storybook).
