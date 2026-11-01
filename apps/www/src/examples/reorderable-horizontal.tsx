"use client"

import * as React from "react"

import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"

const LOGS = ["Gamma ray", "Resistivity", "Density", "Neutron", "Sonic"]

export default function ReorderableHorizontal() {
  const [tracks, setTracks] = React.useState(LOGS)

  return (
    <div className="flex flex-col gap-3">
      <Reorderable
        orientation="horizontal"
        value={tracks}
        onValueChange={setTracks}
        className="flex gap-2"
        aria-label="Log tracks"
      >
        {tracks.map((track) => (
          <ReorderableItem
            key={track}
            value={track}
            label={track}
            className="flex items-center gap-1 rounded-md border bg-background py-1 ps-3 pe-1 text-sm"
          >
            {track}
            <ReorderableHandle />
          </ReorderableItem>
        ))}
      </Reorderable>
      <p className="text-sm text-muted-foreground">
        Track order: {tracks.join(", ")}
      </p>
    </div>
  )
}
