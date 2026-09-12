import { Meter } from "@tecton/react/tecton/meter"

export default function MeterSegments() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Meter label="Continuous" segments={1} value={45} showValue />
      <Meter label="3 segments" segments={3} value={45} showValue />
      <Meter label="5 segments (default)" value={45} showValue />
      <Meter label="10 segments" segments={10} value={45} showValue />
    </div>
  )
}
