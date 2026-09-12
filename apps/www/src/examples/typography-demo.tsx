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
