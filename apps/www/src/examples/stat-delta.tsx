import {
  Stat,
  StatDelta,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

export default function StatDeltaExample() {
  return (
    <div className="flex flex-wrap gap-10">
      <Stat>
        <StatLabel>Recoverable volume</StatLabel>
        <StatValue unit="MSm³">42.1</StatValue>
        <StatDelta trend="up">+3.4%</StatDelta>
      </Stat>
      <Stat>
        <StatLabel>Drilling days</StatLabel>
        <StatValue unit="d">58</StatValue>
        <StatDelta trend="down">-6 d</StatDelta>
      </Stat>
      <Stat>
        <StatLabel>Templates</StatLabel>
        <StatValue>2</StatValue>
        <StatDelta trend="flat">No change</StatDelta>
      </Stat>
    </div>
  )
}
