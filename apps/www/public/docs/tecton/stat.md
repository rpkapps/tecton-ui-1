# Stat

KPI readout with label, tabular mono value, unit, trend delta and helper text.

Source: /docs/tecton/stat.md

**Example — `stat-demo`**

```tsx
import { Stat, StatDelta, StatHelp, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function StatDemo() {
  return (
    <Stat>
      <StatLabel>Cost per barrel</StatLabel>
      <StatValue unit="USD">16.9</StatValue>
      <StatDelta trend="down">-8% vs. Alternative A</StatDelta>
      <StatHelp>Base case, P50 volumes</StatHelp>
    </Stat>
  )
}
```

## Usage

```tsx
import {
  Stat,
  StatLabel,
  StatValue,
  StatDelta,
  StatHelp,
  StatGroup,
} from "@tecton/react/tecton/stat"
```

```tsx
<Stat>
  <StatLabel>Cost per barrel</StatLabel>
  <StatValue unit="USD">16.9</StatValue>
  <StatDelta trend="down">-8% vs. Alternative A</StatDelta>
  <StatHelp>Base case, P50 volumes</StatHelp>
</Stat>
```

> The IBM Plex Mono value with a sans unit is a Tecton typography rule that no shadcn component carries; `Stat` is the building block for the FDA and Well Design cards.

## Composition

Use the following composition:

```text
Stat
├── StatLabel
├── StatValue (unit)
├── StatDelta
└── StatHelp
```

## Sizes

Use the `size` prop on `Stat` to scale the value.

**Example — `stat-sizes`**

```tsx
import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function StatSizes() {
  return (
    <div className="flex items-end gap-10">
      <Stat size="sm">
        <StatLabel>Small</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
      <Stat size="md">
        <StatLabel>Medium</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
      <Stat size="lg">
        <StatLabel>Large</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
    </div>
  )
}
```

## Delta

Use `StatDelta` with `trend` for an up, down or flat indicator with the matching colour.

**Example — `stat-delta`**

```tsx
import { Stat, StatDelta, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function StatDeltaExample() {
  return (
    <div className="flex flex-wrap gap-10">
      <Stat>
        <StatLabel>Recoverable volume</StatLabel>
        <StatValue unit="MSm³">42.1</StatValue>
        <StatDelta trend="up">+3.4%</StatDelta>
      </Stat>
      <Stat>
        <StatLabel>Drilling days</StatLabel>
        <StatValue unit="d">58</StatValue>
        <StatDelta trend="down">-6 d</StatDelta>
      </Stat>
      <Stat>
        <StatLabel>Templates</StatLabel>
        <StatValue>2</StatValue>
        <StatDelta trend="flat">No change</StatDelta>
      </Stat>
    </div>
  )
}
```

## Group

`StatGroup` lays out several stats in a responsive grid; use `align` on each `Stat`.

**Example — `stat-group`**

```tsx
import { Stat, StatDelta, StatGroup, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function StatGroupExample() {
  return (
    <StatGroup className="w-full max-w-lg rounded-lg border bg-card p-4">
      <Stat align="center">
        <StatLabel>Wells</StatLabel>
        <StatValue>4</StatValue>
      </Stat>
      <Stat align="center">
        <StatLabel>Templates</StatLabel>
        <StatValue>2</StatValue>
      </Stat>
      <Stat align="center">
        <StatLabel>CAPEX</StatLabel>
        <StatValue unit="MUSD">312</StatValue>
        <StatDelta trend="down">-4%</StatDelta>
      </Stat>
      <Stat align="center">
        <StatLabel>NPV</StatLabel>
        <StatValue unit="MUSD">1 240</StatValue>
        <StatDelta trend="up">+11%</StatDelta>
      </Stat>
    </StatGroup>
  )
}
```

## API Reference

### Stat

Container that sets the value size and alignment.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `"sm" \| "md" \| "lg"` | "md" | Value font size 14 / 20 / 28 px. |
| `align` | `"start" \| "center" \| "end"` | "start" | Alignment of the parts. |

### StatValue

The value in the mono font with tabular numbers.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `unit` | `ReactNode` | - | Unit rendered after the value. |

### StatDelta

Trend indicator with icon.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trend` | `"up" \| "down" \| "flat"` | "flat" | Direction and colour. |

### StatLabel, StatHelp, StatGroup

Plain styled elements.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - |  |
