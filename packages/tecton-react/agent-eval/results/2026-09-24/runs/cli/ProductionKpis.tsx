import { Alert, AlertTitle, AlertDescription } from "@tecton/react/components/alert"
import {
  Stat,
  StatLabel,
  StatValue,
  StatDelta,
  StatGroup,
} from "@tecton/react/tecton/stat"
import { TriangleAlert } from "lucide-react"

const WATER_CUT_WARNING_THRESHOLD = 30

interface Kpi {
  value: number
  change: number
}

function trendOf(change: number): "up" | "down" | "flat" {
  if (change > 0) return "up"
  if (change < 0) return "down"
  return "flat"
}

function formatChange(change: number): string {
  const sign = change > 0 ? "+" : ""
  return `${sign}${change}%`
}

export function ProductionKpis({
  oilRate,
  gasRate,
  waterCut,
}: {
  oilRate: Kpi
  gasRate: Kpi
  waterCut: Kpi
}) {
  const isWaterCutHigh = waterCut.value > WATER_CUT_WARNING_THRESHOLD

  return (
    <div className="flex flex-col gap-4">
      {isWaterCutHigh ? (
        <Alert variant="warning" appearance="filled">
          <TriangleAlert />
          <AlertTitle>Water cut above threshold</AlertTitle>
          <AlertDescription>
            Water cut is {waterCut.value}%, above the {WATER_CUT_WARNING_THRESHOLD}% warning
            level.
          </AlertDescription>
        </Alert>
      ) : null}
      <StatGroup className="w-full">
        <Stat>
          <StatLabel>Oil rate</StatLabel>
          <StatValue unit="Sm³/d">{oilRate.value}</StatValue>
          <StatDelta trend={trendOf(oilRate.change)}>
            {formatChange(oilRate.change)}
          </StatDelta>
        </Stat>
        <Stat>
          <StatLabel>Gas rate</StatLabel>
          <StatValue unit="MSm³/d">{gasRate.value}</StatValue>
          <StatDelta trend={trendOf(gasRate.change)}>
            {formatChange(gasRate.change)}
          </StatDelta>
        </Stat>
        <Stat>
          <StatLabel>Water cut</StatLabel>
          <StatValue unit="%">{waterCut.value}</StatValue>
          <StatDelta trend={trendOf(waterCut.change)}>
            {formatChange(waterCut.change)}
          </StatDelta>
        </Stat>
      </StatGroup>
    </div>
  )
}
