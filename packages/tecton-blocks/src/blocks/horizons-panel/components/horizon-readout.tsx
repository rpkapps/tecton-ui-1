import * as React from "react"
import { cn } from "cn"

type ReadoutRow = {
  label: string
  value: React.ReactNode
  unit?: string
}

function HorizonReadout({
  className,
  rows,
  ...props
}: React.ComponentProps<"dl"> & { rows: ReadoutRow[] }) {
  return (
    <dl
      data-slot="horizon-readout"
      className={cn("flex flex-col gap-1.5 text-xs", className)}
      {...props}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-3"
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-mono tabular-nums">
            {row.value}
            {row.unit && (
              <span className="text-muted-foreground">{row.unit}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export { HorizonReadout }
export type { ReadoutRow }
