"use client"

import * as React from "react"
import { cn } from "cn"
import {
  ActivityIcon,
  BellIcon,
  BellRingIcon,
  CircleCheckIcon,
  CircleIcon,
  LoaderCircleIcon,
  WrenchIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@tecton/react/components/progress"
import { LinkButton } from "@tecton/react/tecton/link"

import { LogTrack, LogTrackBand } from "../../page-state/components/log-track"
import {
  PageState,
  PageStateActions,
  PageStateCode,
  PageStateContent,
  PageStateDescription,
  PageStateFigure,
  PageStateHeader,
  PageStateMeta,
  PageStateMetaItem,
  PageStateStatus,
  PageStateTitle,
} from "../../page-state/components/page-state"
import { formatTimestamp } from "../../page-state/data"
import { maintenanceCopy, maintenanceWindow } from "../data"
import type { MaintenanceStep, MaintenanceStepStatus } from "../data"

const stepIcon: Record<MaintenanceStepStatus, React.ReactNode> = {
  done: <CircleCheckIcon className="text-success" />,
  active: (
    <LoaderCircleIcon className="animate-spin text-(--page-state-accent)" />
  ),
  pending: <CircleIcon className="text-muted-foreground/60" />,
}

function MaintenanceSteps({
  steps,
  className,
  ...props
}: React.ComponentProps<"div"> & { steps: MaintenanceStep[] }) {
  return (
    <ItemGroup
      data-slot="maintenance-steps"
      className={cn(
        "rounded-lg border border-border-subtle bg-card",
        className
      )}
      {...props}
    >
      {steps.map((step) => (
        <Item
          key={step.id}
          size="xs"
          data-status={step.status}
          className="data-[status=pending]:opacity-60"
        >
          <ItemMedia variant="icon">{stepIcon[step.status]}</ItemMedia>
          <ItemContent className="flex-row items-baseline justify-between gap-3">
            <ItemTitle>{step.title}</ItemTitle>
            <ItemDescription className="truncate text-xs">
              {step.description}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

type MaintenanceProps = Omit<
  React.ComponentProps<typeof PageState>,
  "children"
> & {
  progress?: number
  remaining?: string
  endsAt?: string
  steps?: MaintenanceStep[]
  onNotify?: (subscribed: boolean) => void
}

/**
 * 503 page: planned downtime. Shows how far the window has progressed,
 * the steps still to run and lets the user subscribe to the all-clear.
 * The log carries a hatched "workover" band across the interval being
 * worked on.
 */
function Maintenance({
  className,
  progress = maintenanceWindow.progress,
  remaining = maintenanceWindow.remaining,
  endsAt = maintenanceWindow.endsAt,
  steps = maintenanceWindow.steps,
  onNotify,
  ...props
}: MaintenanceProps) {
  const [subscribed, setSubscribed] = React.useState(false)
  const toggle = () => {
    const next = !subscribed
    setSubscribed(next)
    onNotify?.(next)
  }

  return (
    <PageState
      data-slot="maintenance"
      tone="warning"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={maintenanceCopy.status}>
          {maintenanceCopy.protocol}
        </PageStateStatus>
        <PageStateCode>503</PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{maintenanceCopy.title}</PageStateTitle>
          <PageStateDescription>
            {maintenanceCopy.description}
          </PageStateDescription>
        </PageStateHeader>

        <Progress
          value={progress}
          aria-label="Maintenance progress"
          className="[&_[data-slot=progress-indicator]]:bg-(--page-state-accent)"
        >
          <ProgressLabel>Maintenance window</ProgressLabel>
          <ProgressValue>{() => `${remaining} remaining`}</ProgressValue>
        </Progress>
        <MaintenanceSteps steps={steps} />

        <PageStateActions>
          <LinkButton href={maintenanceCopy.statusHref}>
            <ActivityIcon data-icon="inline-start" /> Status page
          </LinkButton>
          <Button
            variant={subscribed ? "secondary" : "outline"}
            onClick={toggle}
          >
            {subscribed ? (
              <BellRingIcon data-icon="inline-start" />
            ) : (
              <BellIcon data-icon="inline-start" />
            )}
            {subscribed
              ? "We'll email you when it's back"
              : "Notify me when it's back"}
          </Button>
        </PageStateActions>
        <PageStateMeta>
          <PageStateMetaItem label="Back at" value={formatTimestamp(endsAt)} />
          <PageStateMetaItem
            label="Change"
            value={maintenanceWindow.ticket}
            copyable
          />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={29}>
          <LogTrackBand from={0.3} to={0.62} label="WORKOVER IN PROGRESS">
            <WrenchIcon width={28} height={28} strokeWidth={1.5} />
          </LogTrackBand>
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { Maintenance, MaintenanceSteps }
export type { MaintenanceProps }
