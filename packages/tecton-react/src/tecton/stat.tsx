import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

/**
 * Tecton Stat — a KPI readout: label, value in tabular mono (IBM Plex Mono),
 * optional unit, delta/trend and helper text. Used on the FDA and Well
 * Design cards.
 */
const statVariants = cva("flex min-w-0 flex-col gap-0.5", {
  variants: {
    size: {
      sm: "[--stat-value:0.875rem]",
      md: "[--stat-value:1.25rem]",
      lg: "[--stat-value:1.75rem]",
    },
    align: {
      start: "items-start text-start",
      center: "items-center text-center",
      end: "items-end text-end",
    },
  },
  defaultVariants: {
    size: "md",
    align: "start",
  },
})

function Stat({
  className,
  size = "md",
  align = "start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statVariants>) {
  return (
    <div
      data-slot="stat"
      data-size={size}
      className={cn(statVariants({ size, align }), className)}
      {...props}
    />
  )
}

function StatLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-label"
      className={cn("truncate text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function StatValue({
  className,
  unit,
  children,
  ...props
}: React.ComponentProps<"span"> & { unit?: React.ReactNode }) {
  return (
    <span
      data-slot="stat-value"
      className={cn(
        "inline-flex items-baseline gap-1 font-mono text-(length:--stat-value) leading-none font-medium tabular-nums",
        className
      )}
      {...props}
    >
      {children}
      {unit && (
        <span
          data-slot="stat-unit"
          className="font-sans text-[0.6em] font-normal text-muted-foreground"
        >
          {unit}
        </span>
      )}
    </span>
  )
}

/** The colour says whether the change is good news, not which way it went. */
const statDeltaVariants = cva(
  "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums [&_svg]:size-3",
  {
    variants: {
      tone: {
        positive: "text-success",
        negative: "text-destructive",
        neutral: "text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type StatTrend = "up" | "down" | "flat"
type StatTone = "positive" | "negative" | "neutral"

const toneOfTrend: Record<StatTrend, StatTone> = {
  up: "positive",
  down: "negative",
  flat: "neutral",
}

type StatDeltaProps = React.ComponentProps<"span"> & {
  /** Which way the number moved: picks the icon. Default `flat`. */
  trend?: StatTrend | null
  /**
   * Whether the move is good or bad: picks the colour. Defaults to the
   * trend's (up is positive, down negative); set it where down is good
   * news — CAPEX, cost, downtime, risk.
   */
  tone?: StatTone | null
}

function StatDelta({
  className,
  trend,
  tone,
  children,
  ...props
}: StatDeltaProps) {
  const direction = trend ?? "flat"
  const sentiment = tone ?? toneOfTrend[direction]
  const Icon =
    direction === "up"
      ? TrendingUpIcon
      : direction === "down"
        ? TrendingDownIcon
        : MinusIcon
  return (
    <span
      data-slot="stat-delta"
      data-trend={direction}
      data-tone={sentiment}
      className={cn(statDeltaVariants({ tone: sentiment }), className)}
      {...props}
    >
      <Icon aria-hidden />
      {children}
    </span>
  )
}

function StatHelp({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-help"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function StatGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-group"
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-x-6 gap-y-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Stat,
  StatLabel,
  StatValue,
  StatDelta,
  StatHelp,
  StatGroup,
  statVariants,
}
export type { StatDeltaProps, StatTone, StatTrend }
