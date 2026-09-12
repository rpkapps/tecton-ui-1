import { Meter } from "@tecton/react/tecton/meter"

export default function MeterDemo() {
  return <Meter className="max-w-xs" label="Drilling complexity" value={60} valueLabel="Medium" />
}
