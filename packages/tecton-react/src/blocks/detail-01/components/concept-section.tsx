"use client"

import * as React from "react"
import { cn } from "cn"
import {
  AlertTriangleIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  DropletIcon,
  FactoryIcon,
  MoreVerticalIcon,
  PlusIcon,
  WavesIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

import { decisionCounts } from "../data"
import type { Alternative, Concept, Decision } from "../data"

const statusBadge: Record<
  Decision["status"],
  { variant: "success" | "info" | "warning"; label: string }
> = {
  approved: { variant: "success", label: "Approved" },
  review: { variant: "info", label: "Ready for review" },
  attention: { variant: "warning", label: "Needs attention" },
}

const disciplineIcon: Record<
  Decision["discipline"],
  React.ComponentType<{ className?: string }>
> = {
  Subsurface: WavesIcon,
  Drilling: DropletIcon,
  Facilities: FactoryIcon,
}

/** One decision of an alternative: label, chosen value and its approval status. */
function DecisionCard({
  decision,
  className,
}: {
  decision: Decision
  className?: string
}) {
  const Icon = disciplineIcon[decision.discipline]
  const badge = statusBadge[decision.status]
  return (
    <div
      data-slot="decision-card"
      className={cn(
        "flex w-52 shrink-0 snap-start flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground",
        className
      )}
    >
      <span className="text-xs text-muted-foreground">{decision.label}</span>
      <span className="text-sm font-medium">{decision.value}</span>
      <span className="mt-auto flex items-center gap-2 pt-1">
        <Badge variant={badge.variant} size="default">
          {badge.label}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Icon className="size-3" />
          {decision.discipline}
        </span>
      </span>
    </div>
  )
}

/** Alternative row: name, code, reference tag and the horizontal decision cards. */
function AlternativeRow({
  alternative,
  isSelected,
  className,
}: {
  alternative: Alternative
  isSelected?: boolean
  className?: string
}) {
  return (
    <div
      data-slot="alternative-row"
      data-selected={isSelected || undefined}
      className={cn(
        "relative flex flex-col gap-3 border-l border-border pl-4 before:absolute before:top-3 before:-left-px before:h-px before:w-3 before:bg-border data-selected:border-primary",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{alternative.name}</span>
        <Badge variant="secondary" size="default" className="font-mono">
          {alternative.code}
        </Badge>
        {alternative.isReference ? (
          <Badge variant="secondary" appearance="outline" size="default">
            Reference case
          </Badge>
        ) : null}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${alternative.name}`}
        >
          <MoreVerticalIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto"
          aria-label={`Add decision to ${alternative.name}`}
        >
          <PlusIcon />
        </Button>
      </div>
      <div className="-mr-4 flex snap-x gap-2 overflow-x-auto pr-4 pb-1">
        {alternative.decisions.map((decision) => (
          <DecisionCard key={decision.label} decision={decision} />
        ))}
      </div>
    </div>
  )
}

type ConceptSectionProps = React.ComponentProps<"section"> & {
  concept: Concept
  selectedAlternative?: string | null
}

/**
 * A concept on the project overview: summary panels (key decisions,
 * decision status counts, description) and the collapsible list of
 * its alternatives.
 */
function ConceptSection({
  concept,
  selectedAlternative,
  className,
  ...props
}: ConceptSectionProps) {
  const counts = decisionCounts(concept)
  return (
    <section
      data-slot="concept-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <header className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-[4px] bg-primary/15 font-mono text-xs text-primary">
          {concept.index}
        </span>
        <h2 className="text-sm font-medium">{concept.name}</h2>
        <Badge variant="outline" size="default" className="capitalize">
          {concept.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${concept.name}`}
        >
          <MoreVerticalIcon />
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel size="md">
          <PanelHeader className="border-b-0 pb-0">
            <PanelTitle className="text-xs font-normal text-muted-foreground">
              Key decisions
            </PanelTitle>
          </PanelHeader>
          <PanelContent>
            <dl className="divide-y divide-border-subtle text-sm">
              {concept.keyDecisions.length ? (
                concept.keyDecisions.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="font-mono text-xs">{item.value}</dd>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No key decisions yet.
                </p>
              )}
            </dl>
          </PanelContent>
        </Panel>
        <Panel size="md">
          <PanelHeader className="border-b-0 pb-0">
            <PanelTitle className="text-xs font-normal text-muted-foreground">
              Decisions
            </PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ul className="divide-y divide-border-subtle font-mono text-xs">
              <li className="flex items-center gap-2 py-2 first:pt-0">
                <CircleCheckIcon className="size-3.5 text-success" />
                {counts.approved} Approved
              </li>
              <li className="flex items-center gap-2 py-2">
                <CircleDashedIcon className="size-3.5 text-info" />
                {counts.review} Ready for review
              </li>
              <li className="flex items-center gap-2 py-2 last:pb-0">
                <AlertTriangleIcon className="size-3.5 text-warning" />
                {counts.attention} Need attention
              </li>
            </ul>
          </PanelContent>
        </Panel>
        <Panel size="md">
          <PanelHeader className="border-b-0 pb-0">
            <PanelTitle className="text-xs font-normal text-muted-foreground">
              Description
            </PanelTitle>
          </PanelHeader>
          <PanelContent>
            <p className="text-sm">{concept.description}</p>
          </PanelContent>
        </Panel>
      </div>

      {concept.alternatives.length ? (
        <Collapsible
          defaultExpanded
          className="group/alternatives rounded-lg border bg-card"
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-sm font-medium">{concept.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {concept.alternatives.length} FDAs
            </span>
            <CollapsibleTrigger
              aria-label="Toggle alternatives"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground [&_svg]:size-4 [&_svg]:rotate-180 [&_svg]:transition-transform group-data-expanded/alternatives:[&_svg]:rotate-0"
            >
              <ChevronUpIcon />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="flex flex-col gap-6 px-4 pb-4">
              {concept.alternatives.map((alternative) => (
                <AlternativeRow
                  key={alternative.id}
                  alternative={alternative}
                  isSelected={selectedAlternative === alternative.id}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </section>
  )
}

export { ConceptSection, AlternativeRow, DecisionCard }
export type { ConceptSectionProps }
