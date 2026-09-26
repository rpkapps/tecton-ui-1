"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CircleCheckIcon,
  CircleXIcon,
  CloudIcon,
  CloudOffIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from "lucide-react"

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
  ok: <CircleCheckIcon className="text-success" />,
  checking: <LoaderCircleIcon className="animate-spin text-muted-foreground" />,
  failed: <CircleXIcon className="text-(--page-state-accent)" />,
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
  /**
   * Runs each retry; resolve `true` when the connection is back. A rejection
   * counts as still offline.
   */
  onRetry?: () => Promise<boolean> | boolean
  /** Called once a retry finds the connection back. */
  onReconnect?: () => void
}

type Phase = "offline" | "checking" | "online"

/** What the polite status region says; the countdown itself stays silent. */
function announcement(phase: Phase, attempts: number, retryEvery: number) {
  if (phase === "checking") return "Checking the connection…"
  if (phase === "online") return offlineCopy.onlineTitle
  if (attempts === 0) return ""
  return `Still offline. Retrying automatically every ${retryEvery} seconds.`
}

/**
 * Offline page: the client lost the network or the server. Counts down to
 * the next automatic retry, shows which hop failed and lets the user keep
 * working from cache. The browser's `online` event triggers a retry at once;
 * once a retry succeeds the countdown stops and the page says so. The log
 * flat-lines after the last sample received.
 */
function Offline({
  className,
  lastSampleAt = connection.lastSampleAt,
  retryEvery = connection.retryEvery,
  queuedEdits = connection.queuedEdits,
  onRetry,
  onReconnect,
  ...props
}: OfflineProps) {
  const [checks, setChecks] = React.useState<ConnectionCheck[]>(
    connection.checks
  )
  const [seconds, setSeconds] = React.useState(retryEvery)
  const [phase, setPhase] = React.useState<Phase>("offline")
  const [attempts, setAttempts] = React.useState(0)
  const running = React.useRef(false)
  const mounted = React.useRef(true)

  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const retry = React.useCallback(async () => {
    if (running.current) return
    running.current = true
    setPhase("checking")
    setChecks((current) =>
      current.map((check) => ({ ...check, status: "checking" }))
    )
    let online = false
    try {
      online = await (onRetry?.() ??
        new Promise<boolean>((resolve) =>
          window.setTimeout(() => resolve(false), 1200)
        ))
    } catch {
      online = false
    } finally {
      running.current = false
    }
    if (!mounted.current) return
    setChecks((current) =>
      current.map((check) => ({ ...check, status: online ? "ok" : "failed" }))
    )
    setAttempts((count) => count + 1)
    setSeconds(retryEvery)
    setPhase(online ? "online" : "offline")
    if (online) onReconnect?.()
  }, [onRetry, onReconnect, retryEvery])

  // Count down while offline; stop while checking and once back online.
  React.useEffect(() => {
    if (phase !== "offline") return
    const timer = window.setInterval(() => {
      setSeconds((value) => (value > 1 ? value - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  React.useEffect(() => {
    if (seconds === 0 && phase === "offline") void retry()
  }, [seconds, phase, retry])

  // The browser noticed the network is back: check at once.
  React.useEffect(() => {
    if (phase === "online") return
    const onOnline = () => void retry()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [phase, retry])

  const time = formatTimestamp(lastSampleAt)
  const isOnline = phase === "online"
  const isChecking = phase === "checking"

  return (
    <PageState
      data-slot="offline"
      data-phase={phase}
      tone={isOnline ? "success" : "warning"}
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={isOnline ? "Connected" : offlineCopy.status}>
          {isOnline ? "Online" : offlineCopy.protocol}
        </PageStateStatus>
        <PageStateCode>
          {isOnline ? (
            <CloudIcon
              className="size-16 md:size-20"
              strokeWidth={1.25}
              aria-hidden
            />
          ) : (
            <CloudOffIcon
              className="size-16 md:size-20"
              strokeWidth={1.25}
              aria-hidden
            />
          )}
        </PageStateCode>
        <PageStateHeader>
          <PageStateTitle>
            {isOnline ? offlineCopy.onlineTitle : offlineCopy.title}
          </PageStateTitle>
          <PageStateDescription>
            {isOnline ? offlineCopy.onlineDescription : offlineCopy.description}
          </PageStateDescription>
        </PageStateHeader>
        <ConnectionChecks checks={checks} />
        {!isOnline && (
          <PageStateActions>
            <Button onPress={() => void retry()} isDisabled={isChecking}>
              <RefreshCwIcon
                data-icon="inline-start"
                className={cn(isChecking && "animate-spin")}
              />
              {isChecking ? "Checking…" : "Retry now"}
            </Button>
            <LinkButton variant="outline" href={offlineCopy.workOfflineHref}>
              Work offline
            </LinkButton>
            <span
              data-slot="offline-countdown"
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="off"
            >
              {isChecking ? "Reconnecting…" : `Retrying in ${seconds} s`}
            </span>
          </PageStateActions>
        )}
        <span role="status" className="sr-only">
          {announcement(phase, attempts, retryEvery)}
        </span>
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
