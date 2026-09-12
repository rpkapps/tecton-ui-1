// Synced from shadcn/ui (apps/v4/examples/aria/progress-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"

import { Progress } from "@tecton/react/components/progress"

export default function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress aria-label="Loading" value={progress} className="w-[60%]" />
}
