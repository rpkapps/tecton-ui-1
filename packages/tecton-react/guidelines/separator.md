---
component: Separator
module: "@tecton/react/components/separator"
family: surfaces
exports: [Separator]
notFor:
  - need: a divider between the rows of a list
    use: ItemSeparator
  - need: the rule under a panel title
    use: PanelHeader
  - need: the borders between the regions of the application frame
    use: AppShell
related: [Item, Panel, Card]
---

## Use it when

- Two groups of content need a visible break that no heading or spacing gives them.
- A toolbar or a meta row needs a vertical rule between clusters of controls.
- A labelled divider: a `role="separator"` flex row with a `Separator` on each side of the text.

## Do

- Pick the weight with `emphasis="subtle" | "default" | "strong"`; these are the three Tecton divider levels.
- Set the axis with `orientation="vertical"`, and let the parent flex row give it height — it carries `self-stretch`.
- Keep `className` to layout (`flex-1`, `my-2`): the variant owns colour and thickness.
- Reach for a component's own divider first — `ItemSeparator` in an `ItemGroup`, `border-b` on a `CardHeader`, `PanelHeader`'s built-in rule.

## Don't

### HIGH A hand-drawn rule with a stock Tailwind colour

Wrong:

```tsx
<div className="flex flex-col gap-4">
  <p>Alternative A</p>
  <div className="border-t border-gray-200" />
  <p>Alternative B</p>
</div>
```

Correct:

```tsx
<div className="flex flex-col gap-4">
  <p>Alternative A</p>
  <Separator emphasis="subtle" />
  <p>Alternative B</p>
</div>
```

Tecton resets Tailwind's stock palette to `initial`, so `border-gray-200` generates no CSS and the rule is invisible in both modes; `Separator` also carries `role="separator"`, which a bare `div` does not.

### MEDIUM Recolouring the rule instead of raising its emphasis

Wrong:

```tsx
<Separator className="bg-zinc-300 dark:bg-zinc-700" />
```

Correct:

```tsx
<Separator emphasis="strong" />
```

The three emphases map to `--border-subtle`, `--border` and `--border-strong`, which already switch between modes; the stock `zinc` classes emit nothing, and `no-restyle` reports a colour the variant owns.

### MEDIUM A vertical rule with a hand-set height

Wrong:

```tsx
<div className="flex items-center gap-4">
  <span>Subtle</span>
  <Separator orientation="vertical" className="h-4 w-px bg-border" />
  <span>Strong</span>
</div>
```

Correct:

```tsx
<div className="flex h-8 items-center gap-4">
  <span>Subtle</span>
  <Separator orientation="vertical" />
  <span>Strong</span>
</div>
```

A vertical `Separator` is `w-px self-stretch`, so it takes its height from the flex row; setting `h-4` freezes it at one size and `no-restyle` reports the size and colour.
