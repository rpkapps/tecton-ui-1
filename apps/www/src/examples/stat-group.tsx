import {
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

export default function StatGroupExample() {
  return (
    <StatGroup className="w-full max-w-lg rounded-lg border bg-card p-4">
      <Stat align="center">
        <StatLabel>Wells</StatLabel>
        <StatValue>4</StatValue>
      </Stat>
      <Stat align="center">
        <StatLabel>Templates</StatLabel>
        <StatValue>2</StatValue>
      </Stat>
      <Stat align="center">
        <StatLabel>CAPEX</StatLabel>
        <StatValue unit="MUSD">312</StatValue>
        <StatDelta trend="down" tone="positive">
          -4%
        </StatDelta>
      </Stat>
      <Stat align="center">
        <StatLabel>NPV</StatLabel>
        <StatValue unit="MUSD">1 240</StatValue>
        <StatDelta trend="up">+11%</StatDelta>
      </Stat>
    </StatGroup>
  )
}
