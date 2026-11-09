import * as React from "react"
import { CheckIcon, MinusIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { colormaps, type Colormap } from "./colormaps"
import { profile } from "./perception"
import { ColormapBar, ScalePreview } from "./parts"

type Answers = {
  data: "resistivity" | "change"
  audience: "screen" | "print" | "cvd"
  look: "modern" | "legacy"
}

type Reason = { good: boolean; text: string }

const LEGACY: Record<string, number> = {
  res2d: 40,
  jet: 32,
  turbo: 26,
  spectral: 12,
}

/** Scores a scale against the answers, with the reasons a person would give. */
function assess(map: Colormap, a: Answers) {
  const p = profile(map.id)
  const reasons: Reason[] = []
  let score = 0
  const diverging = map.group === "diverging"

  if (a.data === "change") {
    if (!diverging) return null
    score += 40
    reasons.push({
      good: true,
      text: "Neutral centre for no change, two hues for up and down",
    })
  } else {
    if (diverging) return null
    if (p.monotonic) {
      score += 15
      reasons.push({
        good: true,
        text: "Lightness rises from conductive to resistive, so “more” reads as lighter",
      })
    }
  }

  if (a.audience === "print") {
    if (a.data === "resistivity" && p.monotonic && p.range > 0.5) {
      score += 30
      reasons.push({
        good: true,
        text: `Survives greyscale printing (${Math.round(p.range * 100)} % lightness range)`,
      })
    } else if (a.data === "resistivity") {
      score -= 40
      reasons.push({
        good: false,
        text: "Lightness turns back, so some values look alike in greyscale",
      })
    }
  }
  if (a.audience === "cvd") {
    if (map.cvdSafe) {
      score += 30
      reasons.push({
        good: true,
        text: "Readable with red–green colour-vision deficiency",
      })
    } else {
      score -= 40
      reasons.push({ good: false, text: "Relies on red–green contrast" })
    }
  }

  if (a.look === "legacy") {
    const bonus = LEGACY[map.id] ?? 0
    score += bonus
    reasons.push(
      bonus >= 26
        ? { good: true, text: "Matches the look of classic ERT reports" }
        : { good: false, text: "Looks different from classic ERT reports" }
    )
  } else {
    score += p.uniformity * 40
    reasons.push({
      good: p.uniformity > 0.7,
      text: `Evenness ${Math.round(p.uniformity * 100)} %: equal steps in resistivity look like equal steps in colour${p.uniformity > 0.7 ? "" : " only roughly"}`,
    })
  }
  return { map, score, reasons }
}

const QUESTIONS = [
  {
    key: "data",
    label: "What is in the section?",
    options: [
      ["resistivity", "Resistivity"],
      ["change", "Change between surveys"],
    ],
  },
  {
    key: "audience",
    label: "Who will read it?",
    options: [
      ["screen", "On screen"],
      ["print", "Printed report"],
      ["cvd", "Colour-blind readers"],
    ],
  },
  {
    key: "look",
    label: "Which look?",
    options: [
      ["modern", "Perceptually even"],
      ["legacy", "Familiar ERT"],
    ],
  },
] as const

/** 16 — Answer three questions; get three scales ranked, with the reasons. */
export default function PickerGuided() {
  const [answers, setAnswers] = React.useState<Answers>({
    data: "resistivity",
    audience: "print",
    look: "modern",
  })
  const ranked = React.useMemo(
    () =>
      colormaps
        .map((m) => assess(m, answers))
        .filter((r) => r !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [answers]
  )
  const [chosen, setChosen] = React.useState<string | null>(null)
  const pick =
    chosen && ranked.some((r) => r.map.id === chosen)
      ? chosen
      : ranked[0].map.id

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <div className="flex flex-col gap-6">
        <FieldGroup className="gap-4">
          {QUESTIONS.map((q) => (
            <Field key={q.key}>
              <FieldTitle id={`p16-${q.key}`}>{q.label}</FieldTitle>
              <ToggleGroup
                aria-labelledby={`p16-${q.key}`}
                variant="outline"
                spacing={0}
                className="flex-wrap"
                value={[answers[q.key]]}
                onValueChange={([next]) => {
                  if (!next) return
                  setAnswers((a) => ({ ...a, [q.key]: next }))
                  setChosen(null)
                }}
              >
                {q.options.map(([value, text]) => (
                  <ToggleGroupItem key={value} value={value}>
                    {text}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ))}
        </FieldGroup>
        <RadioGroup
          aria-label="Recommended colour scales"
          value={pick}
          onValueChange={(next) => setChosen(next as string)}
        >
          {ranked.map((r, i) => (
            <FieldLabel key={r.map.id} htmlFor={`p16-${r.map.id}`}>
              <Field orientation="horizontal" className="items-start">
                <FieldContent className="gap-1.5">
                  <ColormapBar id={r.map.id} className="h-4 w-full" />
                  <FieldTitle>
                    {r.map.name}
                    {i === 0 ? <Badge>Best match</Badge> : null}
                  </FieldTitle>
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {r.reasons.map((reason) => (
                      <li key={reason.text} className="flex gap-1.5">
                        {reason.good ? (
                          <CheckIcon
                            className="mt-0.5 size-3 shrink-0 text-success"
                            aria-label="Pro"
                          />
                        ) : (
                          <MinusIcon
                            className="mt-0.5 size-3 shrink-0"
                            aria-label="Con"
                          />
                        )}
                        {reason.text}
                      </li>
                    ))}
                  </ul>
                </FieldContent>
                <RadioGroupItem value={r.map.id} id={`p16-${r.map.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <FieldDescription>
          Lightness and evenness are measured from each scale’s colours.
        </FieldDescription>
      </div>
      <ScalePreview map={pick} />
    </div>
  )
}
