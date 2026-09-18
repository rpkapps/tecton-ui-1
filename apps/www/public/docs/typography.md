# Typography

Figtree for the interface, IBM Plex Mono for data — mapped to the Tailwind font and text utilities.

Source: /docs/typography.md

Tecton uses **Figtree** for interface text and **IBM Plex Mono** (tabular numerals) for numeric readouts. Both are bundled through Fontsource and exposed as `--font-sans` and `--font-mono` in `@theme inline`, so the standard Tailwind utilities apply:

```tsx
<p className="font-sans text-sm">Interface text</p>
<span className="font-mono tabular-nums">248.6</span>
```

**Example — `typography-demo`**

```tsx
export default function TypographyDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <p className="text-5xl leading-tight font-medium tracking-tight">Display 1</p>
      <h1 className="text-2xl font-medium">Heading 1 — Reservoir modelling</h1>
      <h2 className="text-xl font-medium">Heading 2 — Facies distribution</h2>
      <p className="text-base font-medium">Large — Use for section leads</p>
      <p className="text-sm">
        Medium — Body copy for product UI. Figtree is the interface typeface; it keeps dense
        forms and tables legible at 14px.
      </p>
      <p className="text-xs text-muted-foreground">Small — helper and metadata text</p>
      <div className="flex items-baseline gap-4 font-mono tabular-nums">
        <span className="text-base">248.6 MUSD</span>
        <span className="text-sm">1,204 m</span>
        <span className="text-xs text-muted-foreground">USR-2048</span>
      </div>
    </div>
  )
}
```

## Type scale

The Tecton scale, with the closest Tailwind utilities. Headings use weight 500 (`font-medium`); body text is 400.

| Tecton style | Size / weight / line-height | Tailwind |
| --- | --- | --- |
| display1 | 3rem / 500 / 1.208 | `text-5xl font-medium leading-tight` |
| display2 | 2.5rem / 500 / 1.2 | `text-4xl font-medium leading-tight` |
| display3 | 2rem / 500 / 1.25 | `text-3xl font-medium leading-tight` |
| heading1 | 1.5rem / 500 / 1.25 | `text-2xl font-medium` |
| heading2 | 1.25rem / 500 / 1.2 | `text-xl font-medium` |
| large | 1rem / 500 / 1.25 | `text-base font-medium` |
| medium (body) | 0.875rem / 400 / 1.2857 | `text-sm` |
| mediumStrong | 0.875rem / 500 | `text-sm font-medium` |
| small | 0.75rem / 400 / 1.333 | `text-xs` |
| smallStrong | 0.75rem / 500 | `text-xs font-medium` |
| tiny | 0.625rem / 500 / 1.4 | `text-[0.625rem] font-medium` |
| largeData | 1rem mono | `font-mono text-base tabular-nums` |
| mediumData | 0.875rem mono | `font-mono text-sm tabular-nums` |
| smallData | 0.75rem mono | `font-mono text-xs tabular-nums` |
| actionMedium | 0.875rem / 500 | `text-sm font-medium` (buttons) |
| actionSmall | 0.75rem / 500 | `text-xs font-medium` |

The raw values are also available as `--tecton-font-size-*`, `--tecton-font-weight-*` and `--tecton-line-height-*` variables in `tecton-tokens.css`.

> The shadcn components keep their own text sizes (for example `text-sm` on buttons and inputs), which coincide with Tecton's `actionMedium` / `medium` styles.
