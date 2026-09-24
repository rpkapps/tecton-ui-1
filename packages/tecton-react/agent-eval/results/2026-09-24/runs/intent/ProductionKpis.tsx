import { Alert, AlertDescription, AlertTitle } from "@tecton/react/components/alert"
import { Stat, StatDelta, StatGroup, StatLabel, StatValue } from "@tecton/react/tecton/stat"

interface KpiValue {
  value: number
  change: number
}

interface ProductionKpisProps {
  oilRate: KpiValue
  gasRate: KpiValue
  waterCut: KpiValue
}

const WATER_CUT_WARNING_THRESHOLD = 30

function trendFor(change: number): "up" | "down" | "flat" {
  if (change > 0) return "up"
  if (change < 0) return "down"
  return "flat"
}

function formatChange(change: number): string {
  const sign = change > 0 ? "+" : ""
  return `${sign}${change.toFixed(1)}%`
}

function formatValue(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export function ProductionKpis({ oilRate, gasRate, waterCut }: ProductionKpisProps) {
  const isWaterCutHigh = waterCut.value > WATER_CUT_WARNING_THRESHOLD

  return (
    <div className="flex w-full flex-col gap-4">
      {isWaterCutHigh ? (
        <Alert variant="warning" appearance="filled">
          <AlertTitle>Water cut is above 30%</AlertTitle>
          <AlertDescription>
            Current water cut is {formatValue(waterCut.value)}%, above the 30% threshold.
          </AlertDescription>
        </Alert>
      ) : null}
      <StatGroup className="w-full">
        <Stat>
          <StatLabel>Oil rate</StatLabel>
          <StatValue unit="Sm³/d">{formatValue(oilRate.value)}</StatValue>
          <StatDelta trend={trendFor(oilRate.change)}>{formatChange(oilRate.change)}</StatDelta>
        </Stat>
        <Stat>
          <StatLabel>Gas rate</StatLabel>
          <StatValue unit="MSm³/d">{formatValue(gasRate.value)}</StatValue>
          <StatDelta trend={trendFor(gasRate.change)}>{formatChange(gasRate.change)}</StatDelta>
        </Stat>
        <Stat>
          <StatLabel>Water cut</StatLabel>
          <StatValue unit="%">{formatValue(waterCut.value)}</StatValue>
          <StatDelta trend={trendFor(waterCut.change)}>{formatChange(waterCut.change)}</StatDelta>
        </Stat>
      </StatGroup>
    </div>
  )
}
