"use client"

import * as React from "react"

import { LogCurveIcon } from "@tecton/react/icons/log-curve"
import {
  DocumentTabs,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

const VIEWS = [
  { id: "gamma", name: "Gamma ray" },
  { id: "resistivity", name: "Resistivity" },
  { id: "porosity", name: "Porosity" },
]

export default function DocumentTabsRename() {
  const [views, setViews] = React.useState(VIEWS)

  return (
    <DocumentTabs
      defaultValue="gamma"
      onRename={(id, name) =>
        setViews((all) =>
          all.map((view) => (view.id === id ? { ...view, name } : view))
        )
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Log views">
        {views.map((view) => (
          <DocumentTabsTrigger key={view.id} value={view.id}>
            <LogCurveIcon />
            <DocumentTabsLabel>{view.name}</DocumentTabsLabel>
          </DocumentTabsTrigger>
        ))}
      </DocumentTabsList>
    </DocumentTabs>
  )
}
