"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CancelCircleIcon,
  CheckCircleIcon,
  CloudOffIcon,
  ProgressActivityIcon,
  SyncIcon,
} from "@tecton/react/icons"

import { Button, LinkButton } from "@tecton/react/components/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"

import { LogTrack, LogTrackMarker } from "../../page-state/components/log-track"
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
import { connection, offlineCopy } from "../data"
import type { ConnectionCheck, ConnectionCheckStatus } from "../data"

const checkIcon: Record<ConnectionCheckStatus, React.ReactNode> = {
  ok: <CheckCircleIcon className="text-success" />,
  checking: (
    <ProgressActivityIcon className="animate-spin text-muted-foreground" />
  ),
  failed: <CancelCircleIcon className="text-(--page-state-accent)" />,
}

function ConnectionChecks({
  checks,
  className,
  ...props
}: React.ComponentProps<"div"> & { checks: ConnectionCheck[] }) {
  return (
    <ItemGroup
      data-slot="connection-checks"
      className={cn(
        "rounded-lg border border-border-subtle bg-card",
        className
      )}
      {...props}
    >
      {checks.map((check) => (
        <Item key={check.id} size="sm" data-status={check.status}>
          <ItemMedia variant="icon">{checkIcon[check.status]}</ItemMedia>
          <ItemContent className="flex-row items-baseline justify-between gap-3">
            <ItemTitle>{check.label}</ItemTitle>
            <ItemDescription className="truncate font-mono text-xs">
              {check.detail}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

type OfflineProps = Omit<React.ComponentProps<typeof PageState>, "children"> & {
  lastSampleAt?: string
  retryEvery?: number
  queuedEdits?: number
  /** Runs each retry; resolve `true` when the connection is back. */
  onRetry?: () => Promise<boolean> | boolean
}

/**
 * Offline page: the client lost the network or the server. Counts down to
 * the next automatic retry, shows which hop failed and lets the user keep
 * working from cache. The log flat-lines after the last sample received.
 */
function Offline({
  className,
  lastSampleAt = connection.lastSampleAt,
  retryEvery = connection.retryEvery,
  queuedEdits = connection.queuedEdits,
  onRetry,
  ...props
}: OfflineProps) {
  const [checks, setChecks] = React.useState<ConnectionCheck[]>(
    connection.checks
  )
  const [seconds, setSeconds] = React.useState(retryEvery)
  const [retrying, setRetrying] = React.useState(false)

  const retry = React.useCallback(async () => {
    setRetrying(true)
    setChecks((current) =>
      current.map((check) => ({ ...check, status: "checking" }))
    )
    const online = await (onRetry?.() ??
      new Promise<boolean>((resolve) =>
        window.setTimeout(() => resolve(false), 1200)
      ))
    setChecks((current) =>
      current.map((check) => ({ ...check, status: online ? "ok" : "failed" }))
    )
    setRetrying(false)
    setSeconds(retryEvery)
  }, [onRetry, retryEvery])

  React.useEffect(() => {
    if (retrying) return
    const timer = window.setInterval(() => {
      setSeconds((value) => (value > 1 ? value - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [retrying])

  React.useEffect(() => {
    if (seconds === 0 && !retrying) void retry()
  }, [seconds, retrying, retry])

  const time = formatTimestamp(lastSampleAt)

  return (
    <PageState
      data-slot="offline"
      tone="warning"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={offlineCopy.status}>
          {offlineCopy.protocol}
        </PageStateStatus>
        <PageStateCode>
          <CloudOffIcon
            className="size-16 md:size-20"
            strokeWidth={1.25}
            aria-hidden
          />
        </PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{offlineCopy.title}</PageStateTitle>
          <PageStateDescription>{offlineCopy.description}</PageStateDescription>
        </PageStateHeader>
        <ConnectionChecks checks={checks} />
        <PageStateActions>
          <Button onPress={retry} isDisabled={retrying}>
            <SyncIcon
              data-icon="inline-start"
              className={cn(retrying && "animate-spin")}
            />
            {retrying ? "Checking…" : "Retry now"}
          </Button>
          <LinkButton variant="outline" href={offlineCopy.workOfflineHref}>
            Work offline
          </LinkButton>
          <span
            className="text-sm text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {retrying ? "Reconnecting…" : `Retrying in ${seconds} s`}
          </span>
        </PageStateActions>
        <PageStateMeta>
          <PageStateMetaItem label="Last sample" value={time} />
          <PageStateMetaItem label="Queued edits" value={String(queuedEdits)} />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={37} flatFrom={0.7}>
          <LogTrackMarker
            at={0.7}
            label={`LAST SAMPLE ${lastSampleAt.slice(11, 19)}`}
          />
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { Offline, ConnectionChecks }
export type { OfflineProps }
