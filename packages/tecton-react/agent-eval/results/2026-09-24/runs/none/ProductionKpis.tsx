import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "@tecton/react";

interface KpiValue {
  value: number;
  change: number;
}

interface ProductionKpisProps {
  oilRate: KpiValue;
  gasRate: KpiValue;
  waterCut: KpiValue;
}

const WATER_CUT_WARNING_THRESHOLD = 30;

function formatChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive && "text-green-830",
        isNegative && "text-red-830",
      )}
    >
      {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      <span>{formatChange(change)}</span>
      <span className="font-normal text-muted-foreground">vs last month</span>
    </span>
  );
}

function KpiCard({
  label,
  value,
  unit,
  change,
  decimals = 0,
}: {
  label: string;
  value: number;
  unit: string;
  change: number;
  decimals?: number;
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <div className="text-2xl font-semibold tabular-nums">
          {value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}{" "}
          <span className="text-base font-normal text-muted-foreground">
            {unit}
          </span>
        </div>
        <ChangeIndicator change={change} />
      </CardContent>
    </Card>
  );
}

export function ProductionKpis({
  oilRate,
  gasRate,
  waterCut,
}: ProductionKpisProps) {
  const hasHighWaterCut = waterCut.value > WATER_CUT_WARNING_THRESHOLD;

  return (
    <div className="flex flex-col gap-4">
      {hasHighWaterCut && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>High water cut</AlertTitle>
          <AlertDescription>
            Water cut is {waterCut.value.toFixed(1)}%, above the{" "}
            {WATER_CUT_WARNING_THRESHOLD}% threshold.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Oil rate"
          value={oilRate.value}
          unit="Sm³/d"
          change={oilRate.change}
        />
        <KpiCard
          label="Gas rate"
          value={gasRate.value}
          unit="MSm³/d"
          change={gasRate.change}
          decimals={1}
        />
        <KpiCard
          label="Water cut"
          value={waterCut.value}
          unit="%"
          change={waterCut.change}
          decimals={1}
        />
      </div>
    </div>
  );
}
