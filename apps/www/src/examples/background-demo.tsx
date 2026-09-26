"use client"

import * as React from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  BackgroundEffect,
  backgroundEffects,
  backgroundIntensities,
  backgroundTones,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"
import {
  Stat,
  StatDelta,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

import { BackgroundPreview } from "@/components/background-preview"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]
const tones = backgroundTones
const intensities = backgroundIntensities

export default function BackgroundDemo() {
  const [effect, setEffect] = React.useState<BackgroundEffectName>("seismic")
  const [tone, setTone] = React.useState<(typeof tones)[number]>("azure")
  const [intensity, setIntensity] =
    React.useState<(typeof intensities)[number]>("medium")

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <BackgroundPreview
        className="h-72 p-6"
        background={
          <BackgroundEffect effect={effect} tone={tone} intensity={intensity} />
        }
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Field development
        </p>
        <h3 className="mt-1 text-2xl font-medium">Northern Fairway, phase 2</h3>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat size="sm">
            <StatLabel>Wells</StatLabel>
            <StatValue>14</StatValue>
          </Stat>
          <Stat size="sm">
            <StatLabel>Cost per barrel</StatLabel>
            <StatValue unit="USD">16.9</StatValue>
            <StatDelta trend="down" tone="positive">
              -8%
            </StatDelta>
          </Stat>
          <Stat size="sm">
            <StatLabel>First oil</StatLabel>
            <StatValue>2029</StatValue>
          </Stat>
        </div>
      </BackgroundPreview>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <ToggleGroup
          aria-label="Effect"
          size="sm"
          variant="outline"
          value={[effect]}
          onValueChange={(values) => {
            const [next] = values
            if (next) setEffect(next as BackgroundEffectName)
          }}
          className="flex-wrap"
        >
          {effects.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Tone"
          size="sm"
          variant="outline"
          value={[tone]}
          onValueChange={(values) => {
            const [next] = values
            if (next) setTone(next as (typeof tones)[number])
          }}
        >
          {tones.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Intensity"
          size="sm"
          variant="outline"
          value={[intensity]}
          onValueChange={(values) => {
            const [next] = values
            if (next) setIntensity(next as (typeof intensities)[number])
          }}
        >
          {intensities.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
