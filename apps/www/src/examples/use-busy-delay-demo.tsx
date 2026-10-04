import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"
import { useBusyDelay } from "@tecton/react/tecton/use-busy-delay"

function useFakeRequest() {
  const [pending, setPending] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  const run = (ms: number) => {
    clearTimeout(timer.current)
    setPending(true)
    timer.current = setTimeout(() => setPending(false), ms)
  }

  return [pending, run] as const
}

function Row({ label, ms }: { label: string; ms: number }) {
  const [pending, run] = useFakeRequest()
  const busy = useBusyDelay(pending)

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        className="w-40"
        disabled={pending}
        onClick={() => run(ms)}
      >
        {busy && <Spinner data-icon="inline-start" />}
        {label}
      </Button>
      <span className="font-mono text-xs text-muted-foreground">
        pending {pending ? "true" : "false"} · busy {busy ? "true" : "false"}
      </span>
    </div>
  )
}

export default function UseBusyDelayDemo() {
  return (
    <div className="flex flex-col gap-3">
      <Row label="Fast (100 ms)" ms={100} />
      <Row label="Medium (300 ms)" ms={300} />
      <Row label="Slow (1.5 s)" ms={1500} />
    </div>
  )
}
