export type DecisionStatus = "approved" | "review" | "attention"

export type Decision = {
  label: string
  value: string
  status: DecisionStatus
  discipline: "Subsurface" | "Drilling" | "Facilities"
}

export type Alternative = {
  id: string
  code: string
  name: string
  isReference?: boolean
  decisions: Decision[]
}

export type Concept = {
  id: string
  index: number
  name: string
  status: "ongoing" | "paused" | "closed"
  description: string
  keyDecisions: { label: string; value: string }[]
  alternatives: Alternative[]
}

export type Project = {
  name: string
  status: string
  asset: string
  gates: { id: string; state: "passed" | "current" | "upcoming" }[]
  concepts: Concept[]
}

export const sectionTabs = [
  { id: "overview", label: "Overview" },
  { id: "framing", label: "Framing" },
  { id: "team", label: "Team" },
  { id: "builder", label: "Builder" },
  { id: "time-cost", label: "Time & Cost" },
  { id: "compare", label: "Compare" },
  { id: "analytics", label: "Analytics" },
]

const decisions = (
  values: [string, string, DecisionStatus, Decision["discipline"]][]
) =>
  values.map(([label, value, status, discipline]) => ({
    label,
    value,
    status,
    discipline,
  }))

export const project: Project = {
  name: "Orion Discovery",
  status: "Ongoing",
  asset: "Orion Hub",
  gates: [
    { id: "DG0", state: "passed" },
    { id: "DG1", state: "passed" },
    { id: "DG2", state: "current" },
    { id: "DG3", state: "upcoming" },
    { id: "DG4", state: "upcoming" },
  ],
  concepts: [
    {
      id: "tie-back",
      index: 1,
      name: "Tie Back Concept",
      status: "ongoing",
      description:
        "Uses a cost-efficient subsea template at the Orion Alpha field to pipe raw production back to the Orion FPSO for processing, leveraging existing spare capacity and minimising new infrastructure.",
      keyDecisions: [
        { label: "Reservoir", value: "Orion West" },
        { label: "Host", value: "Orion FPSO" },
        { label: "Drainage strategy", value: "Depletion" },
      ],
      alternatives: [
        {
          id: "1.01",
          code: "FDA 1.01",
          name: "Existing tie-ins",
          isReference: true,
          decisions: decisions([
            ["Total well count", "Minimum case", "approved", "Subsurface"],
            ["Drill locations", "Single cluster", "approved", "Subsurface"],
            [
              "Flowline tie-in point",
              "Existing manifold",
              "approved",
              "Drilling",
            ],
            [
              "Umbilical tie-in point",
              "Existing TUTA",
              "approved",
              "Facilities",
            ],
            [
              "GL/WI/GI tie-in point",
              "Existing manifold",
              "approved",
              "Facilities",
            ],
          ]),
        },
        {
          id: "1.02",
          code: "FDA 1.02",
          name: "Satellite drill locations",
          decisions: decisions([
            ["Total well count", "Minimum case", "approved", "Subsurface"],
            [
              "Drill locations",
              "Distributed satellites",
              "review",
              "Subsurface",
            ],
            [
              "Flowline tie-in point",
              "Existing manifold",
              "approved",
              "Drilling",
            ],
            ["Umbilical tie-in point", "New TUTA", "review", "Facilities"],
            [
              "GL/WI/GI tie-in point",
              "Existing manifold",
              "approved",
              "Facilities",
            ],
          ]),
        },
        {
          id: "1.03",
          code: "FDA 1.03",
          name: "Phased drill locations",
          decisions: decisions([
            ["Total well count", "Minimum case", "approved", "Subsurface"],
            ["Drill locations", "Phased locations", "attention", "Subsurface"],
            ["Flowline tie-in point", "Direct to host", "review", "Drilling"],
            ["Umbilical tie-in point", "Daisy chain", "approved", "Facilities"],
            [
              "GL/WI/GI tie-in point",
              "Existing manifold",
              "approved",
              "Facilities",
            ],
          ]),
        },
        {
          id: "1.04",
          code: "FDA 1.04",
          name: "Daisy chain umbilical",
          decisions: decisions([
            ["Total well count", "Plateau case", "review", "Subsurface"],
            ["Drill locations", "Single cluster", "approved", "Subsurface"],
            [
              "Flowline tie-in point",
              "Existing manifold",
              "approved",
              "Drilling",
            ],
            [
              "Umbilical tie-in point",
              "Daisy chain",
              "attention",
              "Facilities",
            ],
            ["GL/WI/GI tie-in point", "New manifold", "review", "Facilities"],
          ]),
        },
      ],
    },
    {
      id: "new-host",
      index: 2,
      name: "New Host Concept",
      status: "ongoing",
      description:
        "A new unmanned wellhead platform with processing on a leased FPSO.",
      keyDecisions: [
        { label: "Reservoir", value: "Orion West + East" },
        { label: "Host", value: "New WHP" },
        { label: "Drainage strategy", value: "Water injection" },
      ],
      alternatives: [],
    },
    {
      id: "shared-host",
      index: 3,
      name: "Shared Host Lease",
      status: "paused",
      description: "Third-party host capacity under a tariff agreement.",
      keyDecisions: [],
      alternatives: [],
    },
  ],
}

export const decisionCounts = (concept: Concept) => {
  const all = concept.alternatives.flatMap((alt) => alt.decisions)
  return {
    approved: all.filter((d) => d.status === "approved").length,
    review: all.filter((d) => d.status === "review").length,
    attention: all.filter((d) => d.status === "attention").length,
  }
}
