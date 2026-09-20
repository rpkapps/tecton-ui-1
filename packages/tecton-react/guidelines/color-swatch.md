---
component: ColorSwatch
module: "@tecton/react/tecton/color-swatch"
family: data
exports: [ColorSwatch]
notFor:
  - need: a label that names a status or a category in words
    use: Badge
  - need: the colour key for the series of a chart
    use: ChartLegendContent
  - need: a count or a dot pinned to the corner of an icon or an avatar
    use: CountBadge
related: [Badge, ChartLegendContent, TreeViewItemContent]
---

## Use it when

- The colour *is* the data: a horizon colour, a facies legend, a theme token, a series fill.
- The colour needs its name or its value beside it: `label` and `value`.
- The user has to change it: `onChange` turns the swatch into a button with a preset and hex picker.

## Do

- Pass any CSS colour to `color` — a hex, an `oklch()` value or `var(--tecton-color-accent-lime-fill)`; values React Aria cannot parse render as a plain swatch with the value as background.
- Size with `size="xs" | "sm" | "md" | "lg" | "xl"` (12 to 48 px) and pick the corner with `shape="square" | "rounded" | "circle"`.
- Give it an `aria-label` whenever there is no `label`; the swatch is a `role="img"` element with no text of its own.
- Make it editable with `onChange`, which receives a hex string, and replace the Tecton accent presets with `presets` when the palette is domain-specific.

## Don't

### HIGH A coloured div in place of the swatch

Wrong:

```tsx
<div
  className="size-6 rounded-md"
  style={{ background: horizon.color }}
/>
```

Correct:

```tsx
<ColorSwatch
  color={horizon.color}
  size="md"
  aria-label={`${horizon.name} colour`}
/>
```

The swatch is `role="img"` with an accessible name and carries `border border-border-subtle shadow-xs`, which is what keeps a white, pale or transparent colour visible against the surface; a bare div is silent to assistive technology and its inline `style` is what `no-inline-styles` reports.

### HIGH Opening the picker with a press handler

Wrong:

```tsx
<ColorSwatch color={color} onPress={() => setPickerOpen(true)} />
```

Correct:

```tsx
<ColorSwatch color={color} onChange={setColor} aria-label="Series colour" />
```

`ColorSwatch` renders React Aria's non-interactive swatch unless `onChange` is given; only `onChange` wraps it in the `color-swatch-trigger` button with the preset row and the hex field, so `onPress` is not in the props type and lands on a `span` that never fires it.

### MEDIUM Label and value written as sibling spans

Wrong:

```tsx
<div className="flex items-center gap-2">
  <ColorSwatch color="#f59e0b" />
  <span className="text-sm">Sandstone</span>
  <span className="font-mono text-xs text-zinc-500">#f59e0b</span>
</div>
```

Correct:

```tsx
<ColorSwatch color="#f59e0b" label="Sandstone" value="#f59e0b" />
```

With `label` and `value` the component renders the `color-swatch-item` row itself — name over value, the value in the mono face and `muted-foreground`, `className` moved from the swatch to the row — while `text-zinc-500` is stock Tailwind that emits no CSS at all.
