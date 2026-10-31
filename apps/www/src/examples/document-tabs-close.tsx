"use client"

import * as React from "react"
import { HomeIcon } from "lucide-react"

import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsClose,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

const WELLS = [
  { id: "ow-b-01", name: "OW-B: Well-01" },
  { id: "ow-b-02", name: "OW-B: Well-02" },
  { id: "ow-c-07", name: "OW-C: Well-07" },
]

export default function DocumentTabsCloseExample() {
  const [wells, setWells] = React.useState(WELLS)
  const [active, setActive] = React.useState("home")

  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((well) => !ids.includes(well.id)))
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Open wells">
        <DocumentTabsTrigger value="home">
          <HomeIcon />
          <DocumentTabsLabel>Home</DocumentTabsLabel>
        </DocumentTabsTrigger>
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            <WellIcon />
            <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
            <DocumentTabsClose />
          </DocumentTabsTrigger>
        ))}
      </DocumentTabsList>
    </DocumentTabs>
  )
}
