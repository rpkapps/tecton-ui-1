export type WellType = "producer" | "injector" | "exploration" | "appraisal"

export type WellHeader = {
  name: string
  field: string
  operator: string
  rig: string
  spudDate: string
  waterDepth: string
  plannedTd: string
  type: WellType
  notes: string
}

export const operators = [
  { id: "argonaut", label: "Argonaut Oil & Gas PLC" },
  { id: "northern", label: "Northern Lights Energy" },
  { id: "fjord", label: "Fjord Petroleum" },
]

export const rigs = [
  { id: "semi-sub-3000", label: "Semi-Sub 3000" },
  { id: "deepwater-titan", label: "Deepwater Titan" },
  { id: "west-hercules", label: "West Hercules" },
]

export const wellTypes: { id: WellType; label: string; description: string }[] =
  [
    {
      id: "producer",
      label: "Producer",
      description: "Development well producing hydrocarbons.",
    },
    {
      id: "injector",
      label: "Injector",
      description: "Water or gas injection for pressure support.",
    },
    {
      id: "exploration",
      label: "Exploration",
      description: "Tests an undrilled prospect.",
    },
    {
      id: "appraisal",
      label: "Appraisal",
      description: "Delineates a discovery.",
    },
  ]

export const defaultWellHeader: WellHeader = {
  name: "OW-B:Well-03",
  field: "Orion West",
  operator: "argonaut",
  rig: "semi-sub-3000",
  spudDate: "2026-11-04",
  waterDepth: "412",
  plannedTd: "3250",
  type: "producer",
  notes: "",
}
