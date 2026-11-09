import * as React from "react"
import { cn } from "cn"

import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import {
  evenStops,
  formatOhm,
  getColormap,
  hexToRgb,
  percentile,
  rgbToHex,
  sampleStops,
  textOn,
} from "./colormaps"
import { getErtSection } from "./model"
import { SectionPreview, type ColorFn } from "./parts"

type Band = { id: number; name: string; upper: number; color: string }
type Method = "manual" | "equal" | "quantile"

const methods: Record<Method, string> = {
  manual: "Manual (lithology)",
  equal: "Equal log intervals",
  quantile: "Quantiles",
}
const counts = Object.fromEntries(
  [3, 4, 5, 6, 7, 8].map((n) => [String(n), `${n} classes`])
)

const lithology: Band[] = [
  { id: 1, name: "Clay", upper: 10, color: "#3f6fb5" },
  { id: 2, name: "Saturated sand", upper: 40, color: "#5fb8a0" },
  { id: 3, name: "Dry sand", upper: 150, color: "#e3cf6d" },
  { id: 4, name: "Gravel / weathered rock", upper: 600, color: "#e0904a" },
  { id: 5, name: "Bedrock", upper: Infinity, color: "#a9483f" },
]

const LO = 1
const HI = 10 ** 3.5

/** 05 — A classified scale: named bands with their own colour and break values. */
export default function ColorScaleClasses() {
  const section = getErtSection()
  const [method, setMethod] = React.useState<Method>("manual")
  const [count, setCount] = React.useState(5)
  const [bands, setBands] = React.useState(lithology)

  const generate = (m: Method, n: number) => {
    if (m === "manual") return setBands(lithology)
    const stops = evenStops(getColormap("res2d").stops)
    const a = Math.log10(section.min)
    const b = Math.log10(section.max)
    setBands(
      Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        name: `Class ${i + 1}`,
        upper:
          i === n - 1
            ? Infinity
            : m === "equal"
              ? 10 ** (a + ((b - a) * (i + 1)) / n)
              : percentile(section.sorted, ((i + 1) / n) * 100),
        color: rgbToHex(sampleStops(stops, (i + 0.5) / n)),
      }))
    )
  }

  const color = React.useMemo<ColorFn>(() => {
    const rgb = bands.map((b) => hexToRgb(b.color))
    return (v) => {
      const k = bands.findIndex((b) => v <= b.upper)
      return [...rgb[k === -1 ? bands.length - 1 : k], 255]
    }
  }, [bands])

  const area = React.useMemo(() => {
    const totals = bands.map(() => 0)
    for (const v of section.values) {
      const k = bands.findIndex((b) => v <= b.upper)
      totals[k === -1 ? bands.length - 1 : k]++
    }
    return totals.map((t) => (t / section.values.length) * 100)
  }, [bands, section])

  const patch = (id: number, next: Partial<Band>) =>
    setBands((list) => list.map((b) => (b.id === id ? { ...b, ...next } : b)))

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup className="flex-row flex-wrap gap-4">
        <Field className="w-56">
          <FieldLabel htmlFor="v5-method">Classification</FieldLabel>
          <Select
            items={methods}
            value={method}
            onValueChange={(next) => {
              if (!next) return
              setMethod(next)
              generate(next, count)
            }}
          >
            <SelectTrigger id="v5-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(methods).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          className="w-36"
          data-disabled={method === "manual" || undefined}
        >
          <FieldLabel htmlFor="v5-count">Classes</FieldLabel>
          <Select
            items={counts}
            value={String(count)}
            disabled={method === "manual"}
            onValueChange={(next) => {
              if (!next) return
              setCount(Number(next))
              generate(method, Number(next))
            }}
          >
            <SelectTrigger id="v5-count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(counts).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      {/* Segmented bar: each band as wide as its share of the log range. */}
      <div dir="ltr" className="flex flex-col gap-1">
        <div
          role="img"
          aria-label={`Classified scale: ${bands.map((b) => b.name).join(", ")}`}
          className="flex h-8 overflow-hidden rounded-sm border border-border-subtle"
        >
          {bands.map((band, i) => {
            const lower = i === 0 ? LO : bands[i - 1].upper
            const upper = Math.min(band.upper, HI)
            const width =
              ((Math.log10(upper) - Math.log10(lower)) / Math.log10(HI / LO)) *
              100
            return (
              <div
                key={band.id}
                className={cn(
                  "flex min-w-0 items-center justify-center overflow-hidden px-1 text-xs font-medium",
                  textOn(band.color) === "black" ? "text-black" : "text-white"
                )}
                style={{
                  width: `${width.toFixed(3)}%`,
                  backgroundColor: band.color,
                }}
              >
                <span className="truncate">{band.name}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>1 Ω·m</span>
          <span>{formatOhm(HI)} Ω·m</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Colour</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-end">Up to (Ω·m)</TableHead>
              <TableHead className="w-16 text-end">Area</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bands.map((band, i) => (
              <TableRow key={band.id}>
                <TableCell>
                  <ColorSwatch
                    color={band.color}
                    onColorChange={(c) => patch(band.id, { color: c })}
                    presets={lithology.map((b) => b.color)}
                    aria-label={`${band.name} colour`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    variant="text"
                    aria-label={`Class ${i + 1} name`}
                    value={band.name}
                    onChange={(e) => patch(band.id, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {band.upper === Infinity ? (
                    <span className="text-muted-foreground">and above</span>
                  ) : (
                    <Input
                      variant="text"
                      inputMode="decimal"
                      aria-label={`${band.name} upper limit, ohm metres`}
                      className="w-20 text-end"
                      defaultValue={formatOhm(band.upper)}
                      key={`${band.id}-${band.upper}`}
                      onBlur={(e) => {
                        const n = Number(e.target.value.replace(/k$/i, "e3"))
                        const lower = i === 0 ? 0 : bands[i - 1].upper
                        const upper = bands[i + 1]?.upper ?? Infinity
                        if (!Number.isFinite(n) || n <= lower || n >= upper) {
                          e.target.value = formatOhm(band.upper)
                          return
                        }
                        setMethod("manual")
                        patch(band.id, { upper: n })
                      }}
                    />
                  )}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {area[i].toFixed(0)} %
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SectionPreview
          section={section}
          color={color}
          label="Section classified into resistivity bands"
        />
      </div>
    </div>
  )
}
