import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function StatSizes() {
  return (
    <div className="flex items-end gap-10">
      <Stat size="sm">
        <StatLabel>Small</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
      <Stat size="md">
        <StatLabel>Medium</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
      <Stat size="lg">
        <StatLabel>Large</StatLabel>
        <StatValue unit="m">3 250</StatValue>
      </Stat>
    </div>
  )
}
