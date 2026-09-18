# Theming

How the Tecton design tokens map to the shadcn CSS variables, what is exact and what is approximated, how the Tecton colour ramps become the Tailwind palette, and how to extend the theme.

Source: /docs/theming.md

Tecton UI applies the Tecton visual language **only through the shadcn CSS variables**. The generated component files are never edited and no extra CSS targets them; the theme is a set of values for `--background`, `--primary`, `--ring` and friends in `globals.css`, plus a few additional tokens for Tecton-only semantics. Underneath, the Tecton colour ramps replace Tailwind's stock palette (see [Palette](#palette)), so a `bg-red-140` in application code is a Tecton colour too.

## How it works

Raw tokens

`src/styles/tecton-tokens.css` is the generated CSS export of the Tecton design system, pasted verbatim: every token as a CSS custom property (`--tecton-color-bg-default`, `--tecton-radius-50`, `--tecton-font-family-sans`…) with a light block (`:root`) and a dark block (`.dark` / `[data-theme="dark"]`). `tokens/tecton.tokens.json` is the Figma variables export the semantic tokens are picked from; its `foundational/color` ramps are the source of the [palette](#palette).

Mapping as data

`tokens/tecton.map.json` says which Tecton token each shadcn variable takes, with a confidence (`exact` or `approximated`) and a note. Because the Tecton export is themed, the same `var(--tecton-…)` reference serves both modes.

Generated theme

`pnpm --filter @tecton/react tokens:build` writes `tecton-palette.css` (the ramps, and the Tailwind `@theme` that exposes them) and `tecton-theme.css`, patches the variable values inside the CLI-managed `globals.css` (`:root`, `.dark`, `@theme inline` and the two `@import`s — nothing else) and the mapping document.

Verification

`pnpm --filter @tecton/react tokens:check` verifies completeness, WCAG contrast for every surface/foreground pair, a few sanity rules, and that every semantic colour is a literal member of an exposed palette ramp. The tables below are generated from the same data.

## Dark and light

Both modes come from the Tecton export. `--background` is `var(--tecton-color-bg-default)` in `:root` and in `.dark`; the token file itself switches the value (`#f6f4f7` light, `#1d1c1f` dark). Tecton's applications are dark-first, so this site defaults to dark, but light is equally exact.

Toggle the mode with the `dark` class on `<html>` (or `data-theme="dark"`, which the token file also honours). This site uses `next-themes`.

## Token mapping

95 semantic tokens. Each is available as a Tailwind utility (`bg-`, `text-`, `border-`, `ring-`).

| Variable | Utilities | Light | Dark | Purpose |
| --- | --- | --- | --- | --- |
| `--background` | `bg-background` / `text-background` | #f6f4f7 | #1d1c1f | App/page background. |
| `--foreground` | `bg-foreground` / `text-foreground` | #21172a | #f6f5f8 | Default product UI text. |
| `--card` | `bg-card` / `text-card` | #fafafb | #131214 | Paper surface (cards, panels, docks). |
| `--card-foreground` | `bg-card-foreground` / `text-card-foreground` | #21172a | #f6f5f8 | Tecton has no card-specific text token; text-primary is used on every surface. |
| `--popover` | `bg-popover` / `text-popover` | #fafafb | #131214 | Elevated surface for menus and popovers. |
| `--popover-foreground` | `bg-popover-foreground` / `text-popover-foreground` | #21172a | #f6f5f8 | See card-foreground. |
| `--primary` | `bg-primary` / `text-primary` | #644a78 | #5d4d68 | Filled primary action surface. |
| `--primary-foreground` | `bg-primary-foreground` / `text-primary-foreground` | #f7f3f8 | #e5e0eb | Text on the primary action surface (Tecton switches to #ffffff on hover; Vega uses primary/80 instead). |
| `--secondary` | `bg-secondary` / `text-secondary` | #e4dde7 | #3a343e | Filled secondary action surface. |
| `--secondary-foreground` | `bg-secondary-foreground` / `text-secondary-foreground` | #644a78 | #bab3c0 | Text on the secondary action surface. |
| `--muted` | `bg-muted` / `text-muted` | #f0eef3 | #28232c | Tecton has no generic 'muted surface'; the filled-input background (also the table footer) is the closest subdued surface. |
| `--muted-foreground` | `bg-muted-foreground` / `text-muted-foreground` | #604e6e | #a7a2ac | Secondary labels, descriptions and metadata. |
| `--accent` | `bg-accent` / `text-accent` | #ece8f0 | #3a343e | shadcn uses accent for hover/selected rows and ghost hover; Tecton's tertiary hover surface (same as the table hover row) plays that role. |
| `--accent-foreground` | `bg-accent-foreground` / `text-accent-foreground` | #21172a | #f6f5f8 | Text on hovered/selected surfaces. |
| `--destructive` | `bg-destructive` / `text-destructive` | #ba2a0f | #c16e6c | Error status main colour; shadcn draws destructive text on background and destructive buttons with destructive/10. |
| `--border` | `bg-border` / `text-border` | #b2a1bb | #57515c | Default divider/border. |
| `--input` | `bg-input` / `text-input` | #9884a4 | #57515c | Outlined input border. |
| `--ring` | `bg-ring` / `text-ring` | #ff00aa | #ff52a8 | Keyboard focus outline. Vega renders it as ring-3 ring-ring/50; Tecton draws a solid 2px ring. |
| `--chart-1` | `bg-chart-1` / `text-chart-1` | #1b6b6b | #29a6a6 | Chart series colours are chosen from the 7 Tecton accents in the order used by the Cost-vs-Risk panel. |
| `--chart-2` | `bg-chart-2` / `text-chart-2` | #914f20 | #cb8553 | See chart-1. |
| `--chart-3` | `bg-chart-3` / `text-chart-3` | #546918 | #84a138 | See chart-1. |
| `--chart-4` | `bg-chart-4` / `text-chart-4` | #2f5dba | #8ca7de | See chart-1. |
| `--chart-5` | `bg-chart-5` / `text-chart-5` | #994c4c | #c2867a | See chart-1. |
| `--sidebar` | `bg-sidebar` / `text-sidebar` | #fafafb | #131214 | Sidebar sits on the paper surface, like Tecton's side panels. |
| `--sidebar-foreground` | `bg-sidebar-foreground` / `text-sidebar-foreground` | #21172a | #f6f5f8 |  |
| `--sidebar-primary` | `bg-sidebar-primary` / `text-sidebar-primary` | #644a78 | #5d4d68 |  |
| `--sidebar-primary-foreground` | `bg-sidebar-primary-foreground` / `text-sidebar-primary-foreground` | #f7f3f8 | #e5e0eb |  |
| `--sidebar-accent` | `bg-sidebar-accent` / `text-sidebar-accent` | #ece8f0 | #3a343e | See accent. |
| `--sidebar-accent-foreground` | `bg-sidebar-accent-foreground` / `text-sidebar-accent-foreground` | #21172a | #f6f5f8 |  |
| `--sidebar-border` | `bg-sidebar-border` / `text-sidebar-border` | #e4dde7 | #342f39 | Low-emphasis separator inside panels. |
| `--sidebar-ring` | `bg-sidebar-ring` / `text-sidebar-ring` | #ff00aa | #ff52a8 |  |
| `--radius` | `bg-radius` / `text-radius` | 4px |  | Default Tecton corner radius (4px). Non-colour, declared in :root only. |
| `--success` | `bg-success` / `text-success` | #0d7f46 | #78c692 | Status success main colour: text, borders and icons (alert/badge outline and default appearance) and a solid surface with `success-foreground`. |
| `--success-foreground` | `bg-success-foreground` / `text-success-foreground` | #f3fef8 | #001607 | Text on a `success` surface. |
| `--warning` | `bg-warning` / `text-warning` | #9c6201 | #f9a308 | Status warning main colour: text, borders and icons (alert/badge outline and default appearance) and a solid surface with `warning-foreground`. |
| `--warning-foreground` | `bg-warning-foreground` / `text-warning-foreground` | #fafafb | #131214 | Text on a `warning` surface: Tecton's filled-text is meant for the pale `warning-surface`, so the inverse text colour is used on the main colour. |
| `--info` | `bg-info` / `text-info` | #2f5dba | #8ca7de | Status info main colour: text, borders and icons (alert/badge outline and default appearance) and a solid surface with `info-foreground`. |
| `--info-foreground` | `bg-info-foreground` / `text-info-foreground` | #f7f7fa | #0a1324 | Text on an `info` surface. |
| `--neutral` | `bg-neutral` / `text-neutral` | #685d72 | #959497 | Status neutral main colour: text, borders and icons (alert/badge outline and default appearance) and a solid surface with `neutral-foreground`. |
| `--neutral-foreground` | `bg-neutral-foreground` / `text-neutral-foreground` | #fafafb | #131214 | Text on a `neutral` surface (Tecton's filled-text is meant for the `neutral-surface`). |
| `--destructive-foreground` | `bg-destructive-foreground` / `text-destructive-foreground` | #fffaf9 | #2e0000 | Text on the filled error surface. shadcn v4 dropped this token; Tecton restores it for filled error chips/alerts. |
| `--success-surface` | `bg-success-surface` / `text-success-surface` | #0c703e | #4fa66f | Tecton's filled success surface (alert and badge `appearance="filled"` / solid). |
| `--success-surface-foreground` | `bg-success-surface-foreground` / `text-success-surface-foreground` | #f3fef8 | #001607 | Text on `success-surface`. |
| `--warning-surface` | `bg-warning-surface` / `text-warning-surface` | #ffdd89 | #e59306 | Tecton's filled warning surface (alert and badge `appearance="filled"` / solid). |
| `--warning-surface-foreground` | `bg-warning-surface-foreground` / `text-warning-surface-foreground` | #693f01 | #1d0f01 | Text on `warning-surface`. |
| `--info-surface` | `bg-info-surface` / `text-info-surface` | #2f5dba | #6086d2 | Tecton's filled info surface (alert and badge `appearance="filled"` / solid). |
| `--info-surface-foreground` | `bg-info-surface-foreground` / `text-info-surface-foreground` | #f7f7fa | #0a1324 | Text on `info-surface`. |
| `--neutral-surface` | `bg-neutral-surface` / `text-neutral-surface` | #e1dee4 | #2c2b2e | Tecton's filled neutral surface (alert and badge `appearance="filled"` / solid). |
| `--neutral-surface-foreground` | `bg-neutral-surface-foreground` / `text-neutral-surface-foreground` | #4e4556 | #c8c7ca | Text on `neutral-surface`. |
| `--destructive-surface` | `bg-destructive-surface` / `text-destructive-surface` | #a3240d | #c16e6c | Tecton's filled error surface (alert and badge `appearance="filled"` / solid). |
| `--destructive-surface-foreground` | `bg-destructive-surface-foreground` / `text-destructive-surface-foreground` | #fffaf9 | #2e0000 | Text on `destructive-surface`. |
| `--surface-alt` | `bg-surface-alt` / `text-surface-alt` | #f6f4f7 | #323134 | Alternate table row surface. |
| `--border-subtle` | `bg-border-subtle` / `text-border-subtle` | #e4dde7 | #342f39 | Low-emphasis divider (Divider emphasis="subtle", panel separators). |
| `--border-strong` | `bg-border-strong` / `text-border-strong` | #9884a4 | #6e6873 | High-emphasis divider (Divider emphasis="strong"). |
| `--primary-hover` | `bg-primary-hover` / `text-primary-hover` | #865fa0 | #74647f | Button variant=default hovered / focused surface (Tecton lightens on hover). |
| `--primary-hover-foreground` | `bg-primary-hover-foreground` / `text-primary-hover-foreground` | #ffffff | #ffffff | Text on the hovered primary surface. |
| `--primary-pressed` | `bg-primary-pressed` / `text-primary-pressed` | #563f67 | #80708b | Button variant=default pressed surface. |
| `--primary-pressed-foreground` | `bg-primary-pressed-foreground` / `text-primary-pressed-foreground` | #ffffff | #ffffff | Text on the pressed primary surface. |
| `--primary-active` | `bg-primary-active` / `text-primary-active` | #765292 | #80708b | Button variant=default activated surface (aria-expanded / selected). |
| `--primary-active-foreground` | `bg-primary-active-foreground` / `text-primary-active-foreground` | #ffffff | #ffffff | Text on the activated primary surface. |
| `--secondary-hover` | `bg-secondary-hover` / `text-secondary-hover` | #ece8f0 | #514659 | Button variant=secondary hovered / focused surface. |
| `--secondary-hover-foreground` | `bg-secondary-hover-foreground` / `text-secondary-hover-foreground` | #765292 | #e4e0ea | Text on the hovered secondary surface. |
| `--secondary-pressed` | `bg-secondary-pressed` / `text-secondary-pressed` | #ddd5e0 | #5a4f62 | Button variant=secondary pressed surface. |
| `--secondary-pressed-foreground` | `bg-secondary-pressed-foreground` / `text-secondary-pressed-foreground` | #563f67 | #efecf3 | Text on the pressed secondary surface. |
| `--secondary-active` | `bg-secondary-active` / `text-secondary-active` | #dfd4e4 | #5a4f62 | Button variant=secondary activated surface. |
| `--secondary-active-foreground` | `bg-secondary-active-foreground` / `text-secondary-active-foreground` | #593c70 | #efebf4 | Text on the activated secondary surface. |
| `--ghost-foreground` | `bg-ghost-foreground` / `text-ghost-foreground` | #725687 | #bab3c0 | Button variant=ghost (Tecton tertiary) resting text. |
| `--ghost-hover` | `bg-ghost-hover` / `text-ghost-hover` | #ece8f0 | #3a343e | Button variant=ghost hovered / focused surface (same token as accent). |
| `--ghost-hover-foreground` | `bg-ghost-hover-foreground` / `text-ghost-hover-foreground` | #765292 | #cac5d2 | Text on the hovered ghost surface. |
| `--ghost-pressed` | `bg-ghost-pressed` / `text-ghost-pressed` | #e4dde7 | #433d47 | Button variant=ghost pressed surface. |
| `--ghost-pressed-foreground` | `bg-ghost-pressed-foreground` / `text-ghost-pressed-foreground` | #563f67 | #e3e0e8 | Text on the pressed ghost surface. |
| `--ghost-active` | `bg-ghost-active` / `text-ghost-active` | #e9e3ec | #433d47 | Button variant=ghost activated surface. |
| `--ghost-active-foreground` | `bg-ghost-active-foreground` / `text-ghost-active-foreground` | #593c70 | #e3e0e8 | Text on the activated ghost surface. |
| `--outline-border` | `bg-outline-border` / `text-outline-border` | #725687 | #aaa1b2 | Button variant=outline resting border (Tecton Button outlined uses the strong border). |
| `--outline-foreground` | `bg-outline-foreground` / `text-outline-foreground` | #644a78 | #aaa1b2 | Button variant=outline resting text. |
| `--outline-hover` | `bg-outline-hover` / `text-outline-hover` | #f0edf4 | #433d47 | Button variant=outline hovered / focused surface. |
| `--outline-hover-border` | `bg-outline-hover-border` / `text-outline-hover-border` | #865fa0 | #cac5d2 | Button variant=outline hovered / focused border. |
| `--outline-hover-foreground` | `bg-outline-hover-foreground` / `text-outline-hover-foreground` | #765292 | #e4e0ea | Text on the hovered outline surface. |
| `--outline-pressed` | `bg-outline-pressed` / `text-outline-pressed` | #ddd5e0 | #4e4853 | Button variant=outline pressed surface. |
| `--outline-pressed-border` | `bg-outline-pressed-border` / `text-outline-pressed-border` | #563f67 | #d8d5de | Button variant=outline pressed border. |
| `--outline-pressed-foreground` | `bg-outline-pressed-foreground` / `text-outline-pressed-foreground` | #463458 | #efecf3 | Text on the pressed outline surface. |
| `--outline-active` | `bg-outline-active` / `text-outline-active` | #e6ddea | #4e4853 | Button variant=outline activated surface. |
| `--outline-active-border` | `bg-outline-active-border` / `text-outline-active-border` | #674782 | #d9d5e1 | Button variant=outline activated border. |
| `--outline-active-foreground` | `bg-outline-active-foreground` / `text-outline-active-foreground` | #674782 | #efebf4 | Text on the activated outline surface. |
| `--link-foreground` | `bg-link-foreground` / `text-link-foreground` | #725687 | #9a91a2 | Button variant=link (Tecton textOnly) resting text. |
| `--link-hover-foreground` | `bg-link-hover-foreground` / `text-link-hover-foreground` | #6b438c | #bcb2c4 | Button variant=link hovered / focused text. |
| `--link-pressed-foreground` | `bg-link-pressed-foreground` / `text-link-pressed-foreground` | #463458 | #beb1c8 | Button variant=link pressed text. |
| `--link-active-foreground` | `bg-link-active-foreground` / `text-link-active-foreground` | #5c3878 | #beb1c8 | Button variant=link activated text. |
| `--avatar` | `bg-avatar` / `text-avatar` | #994c4c | #c2867a | Avatar fallback surface (Tecton's default avatar fill). |
| `--avatar-foreground` | `bg-avatar-foreground` / `text-avatar-foreground` | #fafafb | #131214 | Initials / icon on the avatar fallback surface. |
| `--input-hover` | `bg-input-hover` / `text-input-hover` | #6d5a7d | #a7a2ac | Outlined input, textarea and select border while hovered. |
| `--table-header` | `bg-table-header` / `text-table-header` | #d5cddb | #433d47 | Table header row surface (Tecton draws the header as a filled band). |
| `--table-active` | `bg-table-active` / `text-table-active` | #e4dde7 | #4e4853 | Selected table row surface; the hovered row uses accent. |
| `--slider` | `bg-slider` / `text-slider` | #6d5a7d | #98939d | Slider range, thumb and (at 60%) track: Tecton's default slider is the graphite accent, not the primary action colour. |
| `--progress` | `bg-progress` / `text-progress` | #6d5a7d | #98939d | Linear progress indicator and (at 38%) track, same graphite accent as the slider. |

## Extra tokens

Tecton has semantics shadcn does not express through variables. They are added following the documented shadcn pattern (a variable in `:root`/`.dark` plus a `--color-*` entry in `@theme inline`) and are used by the Tecton variants of the shadcn components and by the Tecton components and blocks:

| Token | Utilities | Used for |
| --- | --- | --- |
| `--success`, `--warning`, `--info`, `--neutral` | `text-success`, `border-warning`, `bg-info` | Status colour: text, borders and icons (readable on the page and card in both modes); with `--<status>-foreground` also a solid surface |
| `--success-surface`, `--warning-surface`, `--info-surface`, `--neutral-surface`, `--destructive-surface` | `bg-warning-surface`, `text-warning-surface-foreground` | Tecton's filled status surfaces (filled alerts, solid status badges); light mode keeps the pale yellow warning surface |
| `--destructive-foreground` | `text-destructive-foreground` | Text on a `destructive` surface |
| `--surface-alt` | `bg-surface-alt` | Alternate table rows |
| `--border-subtle`, `--border-strong` | `border-border-subtle`, `bg-border-strong` | Separator emphasis levels |
| `--font-sans`, `--font-mono` | `font-sans`, `font-mono` | Figtree / IBM Plex Mono |
| `--radius-sm` … `--radius-2xl` | `rounded-sm` … `rounded-2xl` | Tecton radius scale (2/4/8/12/16px) |

## Palette

Tecton's foundational colours are **contrast ramps**: fifteen families, each with twenty-three steps from `50` (barely off the page background) to `1570` (maximum contrast), and a separate set of values for light and dark mode. A step is the same perceived distance from the background in both modes — `gray-120` is the pale grey of a filled neutral badge on light and the deep grey of the same badge on dark — so one utility class serves both modes and `dark:` variants are not needed.

`tokens:build` exposes these ramps to Tailwind in `tecton-palette.css`: the raw values as `--tecton-palette-<family>-<step>` in `:root` / `.dark`, and one `--color-<family>-<step>` theme entry per value, so `bg-blue-560`, `text-orchid-830`, `border-yellow-160`, `fill-green-560` and every other colour utility work. **Tailwind's stock palette is removed first** (`--color-*: initial`): `bg-red-500` or `text-zinc-400` produce no CSS, so a colour that is not Tecton's cannot slip into a screen. Only `white` and `black` are kept (Tecton's own shades, used for overlays such as `bg-black/10`).

Utilities are `<utility>-<family>-<step>`, for example `bg-blue-120` or `text-graphite-830`.
A step is a contrast level — the same perceived distance from the page background in both
modes — so a single utility is correct in light and dark and never needs a `dark:` pair.

- **Families** (15): `gray`, `graphite`, `mauve`, `violet`, `lilac`, `orchid`, `pink`, `red`, `saffron`, `yellow`, `lemon`, `lime`, `green`, `azure`, `blue`, plus `white` and `black`.
- **Steps** (23): 50, 100, 105, 110, 115, 120, 130, 140, 160, 190, 220, 260, 310, 370, 460, 560, 680, 830, 1000, 1170, 1300, 1440, 1570.

Stock Tailwind colours (`bg-red-500`, `text-zinc-400`) are reset away and emit no CSS.

Hover a cell for the utility name and both values. The semantic variables are literal picks from these ramps (`tokens:check` verifies it), which gives a few recipes:

| Recipe | Classes | Where Tecton uses it |
| --- | --- | --- |
| Tinted surface with readable text | `bg-<family>-120 text-<family>-830` | Filled status badges and alerts |
| Solid fill with light text | `bg-<family>-560 text-<family>-50` | Filled status buttons, avatar badges |
| Coloured text or icon on the page | `text-<family>-560` (light) ≈ `text-<family>-460` | Status text, links |
| Border | `border-<family>-160` | Tinted alerts |

Prefer the semantic tokens (`bg-primary`, `text-success`, `bg-warning-surface`…) whenever one exists: they carry meaning and follow theme changes. Reach for a palette step for the rest — a chart series, a tag colour, a custom badge — instead of a hex value.

Not exposed on purpose: the `core` ramps (a plain 50–900 lightness scale the semantic tokens do not use), the `surface`, `transparent`, `saturations` and `washes` sub-ramps (use the opacity modifier, `bg-gray-370/20`, for translucency), the Matplotlib and Colorcet colormaps (chart scales, not UI colours) and the app accent colours. The hot-pink focus outline is a single value, not a ramp; it is `--ring`.

To update the palette, replace `tokens/tecton.tokens.json` with a newer Figma export and run `tokens:build` and `tokens:check`; the family list lives under `palette` in `tokens/tecton.map.json`.

## Beyond the variables

Variables carry colours, radii and fonts. The rest of the Tecton look of the generated components comes from the `aria-tecton` **style**, a shadcn preset built exactly like Vega or Nova (see [CLI & updates](/docs/cli.md)), not from overrides of the generated files:

- **Focus ring.** A solid 2px `#ff52a8` ring (`ring-2 ring-ring`) instead of Vega's soft 3px halo.
- **Hover and pressed colours.** Buttons lighten towards the foreground on hover and press, like Tecton's action colours, instead of darkening with `primary/80`.
- **Flat controls.** No `shadow-xs` on buttons, inputs and triggers.
- **Input variants.** The *filled* and *text* variants of [Input](/docs/components/input.md), [Textarea](/docs/components/textarea.md) and [Select](/docs/components/select.md).
- **Status colours** and **divider emphasis** are extra tokens (above), used by the Tecton variants of [Alert](/docs/components/alert.md), [Badge](/docs/components/badge.md) and [Separator](/docs/components/separator.md) and by the Tecton components.

## Adding your own tokens

Follow the same pattern as the extra tokens: declare the variable in `:root` and `.dark`, then expose it to Tailwind in `@theme inline`:

```css title="globals.css"
:root {
  --highlight: #fbbc3b;
}
.dark {
  --highlight: #f9a308;
}
@theme inline {
  --color-highlight: var(--highlight);
}
```

Pick values from the palette rather than typing hex codes, so the token follows both modes: `--highlight: var(--tecton-palette-yellow-830);` in `:root` is all that is needed — the palette variable already switches in `.dark`.

If you use the token pipeline, add the entry to `tokens/tecton.map.json` under `extra` instead and run `tokens:build`.
