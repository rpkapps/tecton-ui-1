import {
  Stat,
  StatDelta,
  StatHelp,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

export default function StatDemo() {
  return (
    <Stat>
      <StatLabel>Cost per barrel</StatLabel>
      <StatValue unit="USD">16.9</StatValue>
      <StatDelta trend="down" tone="positive">
        -8% vs. Alternative A
      </StatDelta>
      <StatHelp>Base case, P50 volumes</StatHelp>
    </Stat>
  )
}
