"use client"

import * as React from "react"

import { Meter } from "@tecton/react/tecton/meter"
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridHandle,
  WidgetGridItem,
  WidgetGridResizeHandle,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

const COUNT = 48
const RATE = 30 // updates per widget per second

const WELLS = Array.from({ length: COUNT }, (_, index) => ({
  id: `well-${index}`,
  name: `${String.fromCharCode(65 + (index % 26))}-${10 + index}`,
}))

const NAMES: Record<string, string> = Object.fromEntries(
  WELLS.map(({ id, name }) => [id, name])
)

/**
 * The stream, outside React: every widget's reading, RATE times a second.
 * Each widget subscribes to its own reading; the counters are written to
 * the page directly, so measuring costs no render.
 */
const stream = (() => {
  const values = new Map(WELLS.map(({ id }) => [id, 50]))
  const listeners = new Map<string, Set<() => void>>()
  let timer: ReturnType<typeof setInterval> | undefined
  let updates = 0
  let subscribed = 0
  const tick = () => {
    for (const [id, value] of values) {
      values.set(
        id,
        Math.min(100, Math.max(0, value + (Math.random() - 0.5) * 8))
      )
      for (const listener of listeners.get(id) ?? []) listener()
      updates += 1
    }
  }
  return {
    read: (id: string) => values.get(id) ?? 0,
    subscribe(id: string, listener: () => void) {
      const set = listeners.get(id) ?? new Set()
      set.add(listener)
      listeners.set(id, set)
      subscribed += 1
      timer ??= setInterval(tick, 1000 / RATE)
      return () => {
        set.delete(listener)
        subscribed -= 1
        if (!subscribed) {
          clearInterval(timer)
          timer = undefined
        }
      }
    },
    takeUpdates() {
      const taken = updates
      updates = 0
      return taken
    },
  }
})()

/** Renders of the grid's own parts (the widgets' placement). */
const gridRenders = { count: 0 }

const Reading = React.memo(function Reading({ id }: { id: string }) {
  const value = React.useSyncExternalStore(
    (listener) => stream.subscribe(id, listener),
    () => stream.read(id),
    () => stream.read(id)
  )
  return (
    <div className="grid gap-1.5">
      <span className="font-mono text-lg tabular-nums">{value.toFixed(1)}</span>
      <Meter
        aria-label="Load"
        value={value}
        segments={1}
        color={value > 80 ? "warning" : "info"}
      />
    </div>
  )
})

const Well = React.memo(function Well({
  id,
  name,
}: {
  id: string
  name: string
}) {
  return (
    <WidgetGridItem
      value={id}
      label={name}
      render={(props) => {
        gridRenders.count += 1
        return <Panel size="sm" {...props} />
      }}
    >
      <PanelHeader>
        <WidgetGridHandle />
        <PanelTitle>{name}</PanelTitle>
      </PanelHeader>
      <PanelContent className="flex flex-col justify-end-safe">
        <Reading id={id} />
      </PanelContent>
      <WidgetGridResizeHandle />
    </WidgetGridItem>
  )
})

/** Frames per second, data updates per second and grid renders, written straight to the page. */
function Readout() {
  const fps = React.useRef<HTMLSpanElement>(null)
  const rate = React.useRef<HTMLSpanElement>(null)
  const renders = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    // From here on: what the stream and the drags re-render.
    gridRenders.count = 0
    let frames = 0
    let last = performance.now()
    let frame = requestAnimationFrame(function count(now) {
      frames += 1
      if (now - last >= 500) {
        const seconds = (now - last) / 1000
        if (fps.current)
          fps.current.textContent = String(Math.round(frames / seconds))
        if (rate.current)
          rate.current.textContent = Math.round(
            stream.takeUpdates() / seconds
          ).toLocaleString("en-US")
        if (renders.current)
          renders.current.textContent = String(gridRenders.count)
        frames = 0
        last = now
      }
      frame = requestAnimationFrame(count)
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  const cell = "grid gap-0.5"
  const value = "font-mono text-sm font-medium tabular-nums"
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
      <div className={cell}>
        Frames per second
        <span ref={fps} className={value}>
          –
        </span>
      </div>
      <div className={cell}>
        Readings per second
        <span ref={rate} className={value}>
          –
        </span>
      </div>
      <div className={cell}>
        Widget re-renders
        <span ref={renders} className={value}>
          –
        </span>
      </div>
    </div>
  )
}

const LAYOUT: Array<WidgetGridLayoutItem> = WELLS.map(({ id }, index) => ({
  id,
  x: (index % 4) * 3,
  y: Math.floor(index / 4) * 2,
  w: 3,
  h: 2,
  minW: 2,
  minH: 2,
}))

export default function WidgetGridLive() {
  const [layout, setLayout] = React.useState(LAYOUT)
  return (
    <WidgetGrid
      value={layout}
      onValueChange={setLayout}
      rowHeight={48}
      gap={8}
      stackBelow={400}
      className="flex w-full flex-col gap-3"
    >
      <Readout />
      <div className="max-h-[36rem] overflow-auto rounded-xl">
        <WidgetGridContent>
          {layout.map(({ id }) => (
            <Well key={id} id={id} name={NAMES[id]} />
          ))}
        </WidgetGridContent>
      </div>
    </WidgetGrid>
  )
}
