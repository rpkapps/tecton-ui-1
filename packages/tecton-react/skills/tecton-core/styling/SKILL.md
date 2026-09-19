---
name: styling
description: >
  Colours, tokens and Tailwind classes in a Tecton application. Load before
  writing any className, picking a colour, or overriding the look of a
  @tecton/react component. Tecton deletes Tailwind's stock palette
  (--color-*: initial), so bg-red-500, text-zinc-400, bg-slate-800 and every
  other stock colour utility emit no CSS and render unstyled. Covers the
  semantic tokens (bg-primary, text-success, bg-warning-surface), the
  fifteen-family contrast ramp palette (bg-blue-120, text-orchid-830) and why
  it needs no dark: pairs, the radius and spacing scales, and the exact split
  between what className may set on a Tecton component (layout, position,
  margin) and what belongs to a variant (colour, shape, typography, size,
  padding).
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/theming.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/linting.mdx'
  - 'rpkapps/tecton-ui-1:packages/eslint-config-tecton/index.js'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/styles/tecton-palette.css'
---

# Tecton UI — Styling

Tecton owns the look. The application places components; it does not repaint
them. Two mechanisms carry the theme: **semantic tokens** (the shadcn CSS
variables, retuned to Tecton values) and the **Tecton palette** (the design
system's colour ramps, installed as Tailwind's palette).

## The one rule that breaks everything

`globals.css` resets Tailwind's stock palette before declaring Tecton's:

```css
@theme {
  --color-*: initial; /* every stock Tailwind colour is removed */
}
```

So `bg-red-500`, `text-zinc-400`, `border-slate-700`, `bg-gray-50` (stock
step) match no theme entry and Tailwind **emits no rule**. The class is in the
DOM, TypeScript is happy, an ordinary ESLint pass is clean — and the element
renders with inherited colour. Only `white` and `black` survive, for opacity
overlays such as `bg-black/10`.

Never type a stock Tailwind colour. Never type a hex value.

## Picking a colour

Work down this list and stop at the first that fits.

### 1. Semantic tokens — always preferred

They carry meaning, follow theme changes and are contrast-checked.

| Purpose             | Utilities                                                                      |
| ------------------- | ------------------------------------------------------------------------------ |
| Page / surface      | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-surface-alt`          |
| Text                | `text-foreground`, `text-muted-foreground`, `text-card-foreground`              |
| Brand action        | `bg-primary` + `text-primary-foreground`, `bg-secondary`, `bg-accent`           |
| Status text/border  | `text-success`, `text-warning`, `text-info`, `text-destructive`, `text-neutral` |
| Status surface      | `bg-success-surface` + `text-success-surface-foreground` (same for `warning`, `info`, `neutral`, `destructive`) |
| Borders             | `border-border`, `border-border-subtle`, `border-border-strong`, `border-input` |
| Focus ring          | `ring-ring` (Tecton's pink focus colour)                                        |

### 2. Palette steps — for anything semantics do not cover

Fifteen families: `gray`, `graphite`, `blue`, `azure`, `green`, `lime`,
`yellow`, `saffron`, `lemon`, `red`, `pink`, `orchid`, `mauve`, `lilac`,
`violet`.

Twenty-three steps each: `50 100 105 110 115 120 130 140 160 190 220 260 310
370 460 560 680 830 1000 1170 1300 1440 1570`.

A step is a **contrast level**, not a fixed colour. `50` is barely off the
page background; `1570` is maximum contrast. Each step holds a different value
in light and dark mode and switches automatically, so **one class serves both
modes and `dark:` pairs are never needed**.

Recipes, verified against the semantic tokens:

| Recipe                            | Classes                          |
| --------------------------------- | -------------------------------- |
| Tinted surface with readable text | `bg-<family>-120 text-<family>-830` |
| Solid fill with light text        | `bg-<family>-560 text-<family>-50`  |
| Coloured text or icon on the page | `text-<family>-560`                 |
| Border on a tinted surface        | `border-<family>-160`               |
| Translucency                      | the opacity modifier: `bg-gray-370/20` |

Use these for a chart series, a tag colour, a domain-specific accent — not for
anything a semantic token already names.

### 3. A new token — only when the palette genuinely does not cover it

A colour the palette does not cover is a change to the Tecton token export.
Raise it with the design system rather than declaring one in the application.

## What `className` may do on a Tecton component

`@tecton/eslint-config` encodes this split, and it is the single most common
source of inconsistent Tecton code.

**Allowed** — the application must be able to place a component:

- Layout: `flex`, `grid`, `flex-1`, `col-span-2`, `items-center`, `gap-2`
- Position: `absolute`, `relative`, `top-0`, `z-10`
- Margin and outer width: `mt-4`, `mx-auto`, `w-full`, `max-w-sm`

**Not allowed** — the component owns these through its variants:

- Colour: `bg-*`, `text-*` (colour), `border-*` (colour)
- Shape: `rounded-*`, `border-*` (width)
- Typography: `text-sm`, `font-medium`, `uppercase`
- Size: `h-*`, `min-h-*`, `max-h-*`, `size-*`
- Padding: `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`, `ps-*`, `pe-*`

If you want a different size or colour, there is a variant for it. If there is
no variant, the design system needs one — do not paint it by hand.

Your **own** components are yours: `recommended` only looks at elements
imported from `@tecton/react`. But the palette rule still applies everywhere,
because `bg-red-500` emits no CSS in your component either.

## Scales

| Scale   | Use                                                      |
| ------- | -------------------------------------------------------- |
| Radius  | `rounded-sm` `rounded-md` `rounded-lg` `rounded-xl` `rounded-2xl` (2/4/8/12/16px) |
| Font    | `font-sans` (Figtree), `font-mono` (IBM Plex Mono)        |
| Spacing | Tailwind's default numeric scale (`gap-2`, `mt-4`)        |

Never an arbitrary value: `text-[13px]`, `p-[7px]` and `rounded-[5px]`
silently leave the scale.

## Dark mode

Tecton is dark-first. Both modes come from the same token export, so:

- Semantic tokens switch automatically.
- Palette steps switch automatically.
- You should almost never write a `dark:` variant.

Toggle with the `dark` class on `<html>` (or `data-theme="dark"`).

## Adding your own token

Follow the shadcn pattern — variable in `:root` and `.dark`, then expose it to
Tailwind — and take the value from the palette so it follows both modes:

```css
:root {
  --highlight: var(--tecton-palette-yellow-830);
}
@theme inline {
  --color-highlight: var(--highlight);
}
```

## Common Mistakes

### CRITICAL A stock Tailwind colour anywhere in the project

Wrong:

```tsx
<span className="rounded bg-amber-100 px-2 text-amber-800">Pending</span>
```

Correct:

```tsx
<Badge variant="warning">Pending</Badge>
```

`bg-amber-100` and `text-amber-800` match no entry in the Tecton theme, so
Tailwind emits nothing for them. The badge renders as unstyled inline text
with a stray border radius. Nothing in a normal toolchain reports it.

Source: `apps/www/content/docs/theming.mdx § Palette`

### CRITICAL A hex or arbitrary colour value

Wrong:

```tsx
<div className="bg-[#1d1c1f] text-[#f6f4f7]">…</div>
```

Correct:

```tsx
<div className="bg-background text-foreground">…</div>
```

An arbitrary value does produce CSS, which makes this worse than the previous
mistake: it looks right in the mode you tested and is frozen there. `#1d1c1f`
is the dark page background, so in light mode this renders a black block. Any
colour written as a literal has no light/dark pair and no contrast check.

Source: `apps/www/content/docs/theming.mdx § Adding your own tokens`

### HIGH Overriding a variant's colour or size with `className`

Wrong:

```tsx
<Button className="h-12 rounded-full bg-primary/90 text-base">Run</Button>
```

Correct:

```tsx
<Button size="lg">Run</Button>
```

Height, radius, colour and type size are all owned by the button's variants.
Overriding them by hand produces a control that no longer matches any other
button in the suite, and that silently stops tracking the theme when the
design system changes. `no-restyle` reports each of these four classes.

Source: `packages/eslint-config-tecton/index.js`

### HIGH Pairing palette steps with `dark:`

Wrong:

```tsx
<div className="border-blue-160 bg-blue-120 dark:bg-blue-1000">…</div>
```

Correct:

```tsx
<div className="border-blue-160 bg-blue-120">…</div>
```

`bg-blue-120` already resolves to a pale blue on light and a deep blue on
dark. The `dark:` override replaces the correct dark value with a step chosen
for maximum contrast, so the surface becomes a near-solid block behind the
text it was meant to sit under.

Source: `apps/www/content/docs/theming.mdx § Palette`

### MEDIUM Building class names at runtime on a Tecton component

Wrong:

```tsx
<Badge className={`bg-${status}-120 text-${status}-830`}>{status}</Badge>
```

Correct:

```tsx
const badgeVariant = { ok: "success", warn: "warning", bad: "destructive" } as const
<Badge variant={badgeVariant[status]}>{status}</Badge>
```

Tailwind resolves classes by scanning source text, so an interpolated class is
never generated — and no linter can verify it. `require-static-classes` errors
on this. Map to a variant (or to a complete literal class string) instead.

Source: `packages/eslint-config-tecton/index.js`

### MEDIUM An arbitrary value for spacing, radius or type

Wrong:

```tsx
<div className="gap-[7px] p-[13px] text-[13px]">…</div>
```

Correct:

```tsx
<div className="gap-2 p-3 text-sm">…</div>
```

Tecton owns the spacing, radius and type scales. An arbitrary value leaves the
scale without any signal, and the drift only shows up next to a component that
followed it. `no-arbitrary-values` (in `strict`) reports it with the nearest
scale step.

Source: `apps/www/content/docs/linting.mdx § Checking the whole project`

See also: `tecton-core/components/SKILL.md` — the variant axes each component
offers instead of a `className` override.
