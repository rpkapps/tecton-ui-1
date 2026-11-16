import { Progress, ProgressLabel } from "@tecton/react/progress"

export default function ProgressIndeterminate() {
  return (
    <Progress value={null} className="w-full max-w-sm">
      <ProgressLabel>Loading well logs</ProgressLabel>
    </Progress>
  )
}
