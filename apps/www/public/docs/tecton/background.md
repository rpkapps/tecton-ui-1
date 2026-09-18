# Background

Eleven decorative background effects drawn from oil and gas imagery: seismic sections, contour maps, strata, grids, flow lines, well logs, a drill bit, hexagon meshes, pressure fields and a horizon, plus a perspective wireframe terrain. Quiet by design, themed in both modes.

Source: /docs/tecton/background.md

**Example — `background-demo`**

```tsx
"use client"

import * as React from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  BackgroundEffect,
  backgroundEffects,
  backgroundIntensities,
  backgroundTones,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"
import {
  Stat,
  StatDelta,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

import { BackgroundPreview } from "@/components/background-preview"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]
const tones = backgroundTones
const intensities = backgroundIntensities

export default function BackgroundDemo() {
  const [effect, setEffect] = React.useState<BackgroundEffectName>("seismic")
  const [tone, setTone] = React.useState<(typeof tones)[number]>("azure")
  const [intensity, setIntensity] =
    React.useState<(typeof intensities)[number]>("medium")

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <BackgroundPreview
        className="h-72 p-6"
        background={
          <BackgroundEffect effect={effect} tone={tone} intensity={intensity} />
        }
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Field development
        </p>
        <h3 className="mt-1 text-2xl font-medium">Northern Fairway, phase 2</h3>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat size="sm">
            <StatLabel>Wells</StatLabel>
            <StatValue>14</StatValue>
          </Stat>
          <Stat size="sm">
            <StatLabel>Cost per barrel</StatLabel>
            <StatValue unit="USD">16.9</StatValue>
            <StatDelta trend="down">-8%</StatDelta>
          </Stat>
          <Stat size="sm">
            <StatLabel>First oil</StatLabel>
            <StatValue>2029</StatValue>
          </Stat>
        </div>
      </BackgroundPreview>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <ToggleGroup
          aria-label="Effect"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[effect]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setEffect(next as BackgroundEffectName)
          }}
          className="flex-wrap"
        >
          {effects.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Tone"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[tone]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setTone(next as (typeof tones)[number])
          }}
        >
          {tones.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Intensity"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[intensity]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setIntensity(next as (typeof intensities)[number])
          }}
        >
          {intensities.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
```

## Usage

```tsx
import {
  SeismicBackground,
  ContourBackground,
  StrataBackground,
  GridBackground,
  FlowBackground,
  WellLogBackground,
  DrillBackground,
  HexagonsBackground,
  PressureBackground,
  HorizonBackground,
  TerrainGridBackground,
  BackgroundEffect,
} from "@tecton/react/tecton/background"
```

```tsx
<section className="relative isolate overflow-hidden rounded-lg border bg-background p-6">
  <ContourBackground tone="azure" />
  <h2>Northern Fairway</h2>
  <p>Content goes after the background and renders on top of it.</p>
</section>
```

> Give the container `relative` and `isolate`. The effect is `absolute inset-0 -z-10`, so `isolate` keeps it above the container's own background and below everything else in it. Without `isolate` it can disappear behind the container's `bg-*`.

## Gallery

Every effect behind the same sample text, in the tone `--chart-1` (azure); switch the site theme to see the other mode. The effect only sets its opacity, so the theme decides how it reads. The contour map uses its own elevation ramp.

**Example — `background-gallery`**

```tsx
import {
  BackgroundEffect,
  backgroundEffects,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]

/** Every effect behind the same sample; switch the site theme for the other mode. */
export default function BackgroundGallery() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
      {effects.map((effect) => (
        <BackgroundPreview
          key={effect}
          className="h-40"
          background={<BackgroundEffect effect={effect} tone="azure" />}
        >
          <span className="text-sm font-medium">{effect}</span>
          <span className="text-xs text-muted-foreground">
            Sample text stays readable
          </span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
```

| Effect | Motif | Motion | Suggested use |
| --- | --- | --- | --- |
| `SeismicBackground` | Survey in section: seismogram, surface, faulted strata, source with wavefront rings | Rings ripple out from the source | Hero and summary cards |
| `ContourBackground` | Structure map isolines, coloured by elevation | Gentle wander | The calm default for most surfaces |
| `StrataBackground` | Cross-section of bedding planes with tints | Pans very slowly along the section | Dense dashboards |
| `GridBackground` | Orthogonal line grid with nodes | Nodes glow in turn; optional pointer reveal | Landing, onboarding |
| `FlowBackground` | Gathering and distribution: streams converge into a hub, then branch out through junctions with nodes | Pulses travel along the lines; the hub rings breathe | Pipelines and process screens; the liveliest one |
| `WellLogBackground` | Cross-section around a wellbore: strata, log tracks, casing | Tool string runs down the hole; the logging tool pulses | Wide hero and sign-in surfaces |
| `DrillBackground` | Bit seen from above | Slow rotation | Centred hero content |
| `HexagonsBackground` | Hexagonal simulation mesh | Cells glow in turn; optional pointer reveal | Simulation and modelling screens |
| `PressureBackground` | Soft gradient field | Blobs migrate | Busy screens; the most abstract |
| `HorizonBackground` | Ground line with layers | Breathing opacity | Empty states, onboarding |
| `TerrainGridBackground` | Wireframe surface of squares in perspective, glowing nodes | Nodes pulse; optional pointer reveal | Landing and sign-in pages |

## Tone

`tone` picks the ink from the theme: `neutral` uses `--foreground`, `primary` uses `--primary`, and the others use the chart accents (`--chart-1` azure, `--chart-2` saffron, `--chart-3` lime, `--chart-4` blue), which already flip between modes. Red is deliberately absent: it is the alarm colour in every control room.

**Example — `background-tones`**

```tsx
import {
  SeismicBackground,
  backgroundTones,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

export default function BackgroundTones() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
      {backgroundTones.map((tone) => (
        <BackgroundPreview
          key={tone}
          className="h-32"
          background={<SeismicBackground tone={tone} intensity="high" />}
        >
          <span className="text-sm font-medium">{tone}</span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
```

### Contour map colours

`ContourBackground` is a continuous structure map: isolines of one height field, coloured by elevation like a printed map, deep to high: blue, azure, lime, saffron, with every fourth line drawn as an index contour and a flat stepped tint between the lines. That is `palette="map"`, the default; `palette="tone"` draws it in the single `tone` like the other effects. `grid` adds a survey grid under the isolines. The map is 4K-sized.

**Example — `background-contour`**

```tsx
import { ContourBackground } from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

export default function BackgroundContour() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      <BackgroundPreview
        className="h-48"
        background={<ContourBackground intensity="high" />}
      >
        <span className="text-sm font-medium">palette="map"</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={
          <ContourBackground palette="tone" tone="azure" intensity="high" />
        }
      >
        <span className="text-sm font-medium">palette="tone"</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<ContourBackground grid intensity="high" />}
      >
        <span className="text-sm font-medium">grid</span>
      </BackgroundPreview>
    </div>
  )
}
```

## Intensity and speed

`intensity` sets the opacity of the effect's ink (`low` 8%, `medium` 16%, `high` 32%), so text over it keeps its contrast; small accents such as nodes, the casing or the main seismic event are drawn at up to 1.8 times that, and soft fills at under half; `speed` sets the base cycle (`slow` 60s, `normal` 36s, `fast` 18s). Even `high` and `fast` stay within a texture rather than a picture.

**Example — `background-intensity`**

```tsx
import {
  HexagonsBackground,
  backgroundIntensities,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

export default function BackgroundIntensity() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      {backgroundIntensities.map((intensity) => (
        <BackgroundPreview
          key={intensity}
          className="h-36"
          background={
            <HexagonsBackground tone="saffron" intensity={intensity} />
          }
        >
          <span className="text-sm font-medium">{intensity}</span>
          <span className="text-xs text-muted-foreground">
            Body copy over the pattern
          </span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
```

## Motion

Every effect freezes on its static frame with `animate={false}`, under `prefers-reduced-motion: reduce`, while it is scrolled out of view and while the tab is hidden. In print and forced-colours mode it is hidden altogether. Nothing tracks the pointer unless you ask for it.

**Example — `background-static`**

```tsx
import {
  FlowBackground,
  SeismicBackground,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

/** `animate={false}` freezes an effect on its first frame; reduced motion does the same. */
export default function BackgroundStatic() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <BackgroundPreview
        className="h-40"
        background={<SeismicBackground tone="lime" animate={false} />}
      >
        <span className="text-sm font-medium">Seismic, static</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-40"
        background={<FlowBackground tone="lime" speed="slow" />}
      >
        <span className="text-sm font-medium">Flow, slow</span>
      </BackgroundPreview>
    </div>
  )
}
```

### Pointer reveal

`GridBackground`, `HexagonsBackground` and `TerrainGridBackground` take `interactive` to light up the pattern around the pointer as it moves over the container. They listen on the parent element, so the background itself stays `pointer-events: none`.

**Example — `background-interactive`**

```tsx
import {
  GridBackground,
  HexagonsBackground,
  TerrainGridBackground,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

/** The pointer reveals the pattern around it; the effects stay quiet otherwise. */
export default function BackgroundInteractive() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      <BackgroundPreview
        className="h-48"
        background={<GridBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">grid</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<HexagonsBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">hexagons</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<TerrainGridBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">terrain-grid</span>
      </BackgroundPreview>
    </div>
  )
}
```

## Picking by name

`BackgroundEffect` renders an effect from its name, and `backgroundEffects` maps the names to the components, for a settings screen where the person chooses their own background. `backgroundTones`, `backgroundIntensities` and `backgroundSpeeds` list the values of the shared props for the same purpose.

```tsx
import { BackgroundEffect, backgroundEffects } from "@tecton/react/tecton/background"

const names = Object.keys(backgroundEffects) // "seismic" | "contour" | …

<BackgroundEffect effect={preference} tone="azure" intensity="low" />
```

## API Reference

### Shared props

Every effect accepts the props of `div` plus:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tone` | `"neutral" \| "primary" \| "azure" \| "saffron" \| "lime" \| "blue"` | "neutral" | Ink colour, from the theme. |
| `intensity` | `"low" \| "medium" \| "high"` | "medium" | Opacity of the ink: 8%, 16% or 32%. Accents go up to 1.8 times that, soft fills to under half. Lines cover little area, so even `high` reads as a texture. |
| `speed` | `"slow" \| "normal" \| "fast"` | "normal" | Base cycle length: 60s, 36s or 18s. |
| `animate` | `boolean` | true | Play the motion. Reduced motion, off-screen and hidden tab pause it regardless. |

The rendered element is `aria-hidden` with `role="presentation"`, `pointer-events: none`, and carries `data-slot="background"`, `data-effect`, `data-tone`, `data-intensity`, `data-speed`, `data-animate` and, while paused, `data-paused`.

### ContourBackground

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `palette` | `"map" \| "tone"` | "map" | `map` colours the isolines by elevation with the chart accents; `tone` uses the single `tone`. |
| `grid` | `boolean` | false | Draw a survey grid under the isolines. |

### GridBackground, HexagonsBackground, TerrainGridBackground

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `interactive` | `boolean` | false | Reveal the pattern around the pointer as it moves over the parent element. |

### BackgroundEffect

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | `BackgroundEffectName` | — | Which effect to render. The union of the keys of `backgroundEffects`. The other props are those of the chosen effect, so `interactive`, `palette` and `grid` pass through. |

### Background

The shared layer the effects are built on. Use it to compose your own effect with the same positioning, tone variables (`--bg-tone`, `--bg-alpha`, `--bg-duration`, and the derived `--bg-ink`, `--bg-ink-soft`, `--bg-ink-strong`), pausing and reduced-motion handling.
