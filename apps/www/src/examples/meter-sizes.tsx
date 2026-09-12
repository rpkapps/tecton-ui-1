import { Meter } from "@tecton/react/tecton/meter"

export default function MeterSizes() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Meter size="sm" label="Small" value={80} showValue />
      <Meter size="md" label="Medium" value={80} showValue />
      <Meter size="lg" label="Large" value={80} showValue />
    </div>
  )
}
