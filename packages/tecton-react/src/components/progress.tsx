"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "cn"

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "bg-progress-track relative flex h-1 w-full items-center overflow-x-hidden rounded-none",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "bg-progress data-indeterminate:motion-reduce:bg-progress h-full transition-all data-indeterminate:w-full data-indeterminate:bg-transparent data-indeterminate:bg-[linear-gradient(to_right,transparent_41.667%,var(--color-progress)_41.667%,var(--color-progress)_58.333%,transparent_58.333%)] data-indeterminate:bg-size-[240%_100%] data-indeterminate:bg-no-repeat data-indeterminate:motion-safe:animate-[tw-shimmer_1.6s_cubic-bezier(0.4,0,0.6,1)_infinite] data-indeterminate:motion-reduce:animate-pulse data-indeterminate:motion-reduce:bg-none rtl:data-indeterminate:motion-safe:[animation-direction:reverse]",
        className
      )}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ms-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
