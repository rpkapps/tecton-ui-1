"use client"

import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

const WELLS = [
  { id: "ow-b-01", name: "OW-B: Well-01", field: "Orion Discovery" },
  { id: "w2", name: "Well-02" },
  { id: "w3", name: "Well-03" },
  { id: "ow-c-07", name: "OW-C: Well-07", field: "Vega North" },
]

export default function DocumentTabsReorder() {
  const [wells, setWells] = React.useState(WELLS)

  return (
    <DocumentTabs
      defaultValue="ow-b-01"
      onReorder={(ids) =>
        setWells((all) => ids.map((id) => all.find((well) => well.id === id)!))
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Open wells">
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            <WellIcon />
            <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
            {well.field ? <Badge variant="outline">{well.field}</Badge> : null}
          </DocumentTabsTrigger>
        ))}
      </DocumentTabsList>
    </DocumentTabs>
  )
}
