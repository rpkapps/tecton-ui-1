"use client"

import * as React from "react"
import { Maximize2Icon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  BackgroundEffect,
  backgroundEffects,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"
import {
  Stat,
  StatDelta,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]
const tones = [
  "neutral",
  "primary",
  "azure",
  "saffron",
  "lime",
  "blue",
] as const
const intensities = ["low", "medium", "high"] as const

function Sample() {
  return (
    <>
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
          <StatDelta trend="down">-8%</StatDelta>
        </Stat>
        <Stat size="sm">
          <StatLabel>First oil</StatLabel>
          <StatValue>2029</StatValue>
        </Stat>
      </div>
    </>
  )
}

export default function BackgroundDemo() {
  const [effect, setEffect] = React.useState<BackgroundEffectName>("seismic")
  const [tone, setTone] = React.useState<(typeof tones)[number]>("azure")
  const [intensity, setIntensity] =
    React.useState<(typeof intensities)[number]>("medium")
  const [fullscreen, setFullscreen] = React.useState(false)

  React.useEffect(() => {
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="relative isolate flex h-72 flex-col justify-end overflow-hidden rounded-lg border bg-background p-6">
        <BackgroundEffect effect={effect} tone={tone} intensity={intensity} />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View fullscreen"
          className="absolute top-3 right-3"
          onPress={() => setFullscreen(true)}
        >
          <Maximize2Icon />
        </Button>
        <Sample />
      </div>
      {fullscreen && (
        <div
          role="dialog"
          aria-label="Background preview"
          className="fixed inset-0 isolate z-50 flex flex-col justify-end bg-background p-10"
        >
          <BackgroundEffect effect={effect} tone={tone} intensity={intensity} />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
            onPress={() => setFullscreen(false)}
          >
            <XIcon /> Close
          </Button>
          <div className="max-w-3xl">
            <Sample />
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <ToggleGroup
          aria-label="Effect"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[effect]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setEffect(next as BackgroundEffectName)
          }}
          className="flex-wrap"
        >
          {effects.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Tone"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[tone]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setTone(next as (typeof tones)[number])
          }}
        >
          {tones.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Intensity"
          size="sm"
          variant="outline"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[intensity]}
          onSelectionChange={(keys) => {
            const [next] = keys
            if (next) setIntensity(next as (typeof intensities)[number])
          }}
        >
          {intensities.map((name) => (
            <ToggleGroupItem key={name} id={name}>
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
