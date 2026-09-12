import { CheckIcon } from "lucide-react"

import { CircularProgress } from "@tecton/react/tecton/circular-progress"

export default function CircularProgressValue() {
  return (
    <div className="flex items-center gap-8">
      <CircularProgress size="lg" value={38} aria-label="Wells drilled" showValue />
      <CircularProgress size="lg" value={7} minValue={0} maxValue={12} aria-label="Templates" formatOptions={{ style: "decimal" }}>
        7/12
      </CircularProgress>
      <CircularProgress size="lg" value={100} color="success" aria-label="Export">
        <CheckIcon className="size-5 text-success" />
      </CircularProgress>
    </div>
  )
}
