"use client"

import * as React from "react"
import { cn } from "cn"
import {
  ActivityIcon,
  ChevronRightIcon,
  DatabaseIcon,
  RefreshCwIcon,
} from "lucide-react"

import { Button, LinkButton } from "@tecton/react/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import { Spinner } from "@tecton/react/components/spinner"
import { CopyButton } from "@tecton/react/tecton/copy-button"

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
import { formatErrorReport, serverError, serverErrorCopy } from "../data"
import type { ServerErrorDetails } from "../data"

type ServerErrorProps = Omit<
  React.ComponentProps<typeof PageState>,
  "children"
> & {
  details?: ServerErrorDetails
  /** Called when the user retries; resolve to leave the page, reject to stay. */
  onRetry?: () => Promise<void> | void
}

/**
 * 500 page: the server failed to handle the request. Retry, fall back to the cached
 * view, copy a support-ready report, and expand the technical details.
 * The log spikes off-scale where the failure hit.
 */
function ServerError({
  className,
  details = serverError,
  onRetry,
  ...props
}: ServerErrorProps) {
  const [retrying, setRetrying] = React.useState(false)
  const retry = async () => {
    setRetrying(true)
    try {
      await (onRetry?.() ??
        new Promise((resolve) => window.setTimeout(resolve, 900)))
    } finally {
      setRetrying(false)
    }
  }

  return (
    <PageState
      data-slot="server-error"
      tone="destructive"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={serverErrorCopy.status}>
          {serverErrorCopy.protocol}
        </PageStateStatus>
        <PageStateCode>500</PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{serverErrorCopy.title}</PageStateTitle>
          <PageStateDescription>
            {serverErrorCopy.description}
          </PageStateDescription>
        </PageStateHeader>
        <PageStateActions>
          <Button onPress={retry} isDisabled={retrying}>
            {retrying ? (
              <Spinner />
            ) : (
              <RefreshCwIcon data-icon="inline-start" />
            )}
            Try again
          </Button>
          <LinkButton variant="outline" href={serverErrorCopy.cachedHref}>
            <DatabaseIcon data-icon="inline-start" /> Open cached view
          </LinkButton>
          <CopyButton
            value={formatErrorReport(details)}
            variant="ghost"
            size="default"
          >
            Copy error details
          </CopyButton>
        </PageStateActions>

        <Collapsible className="group/details flex flex-col gap-2">
          <CollapsibleTrigger className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronRightIcon className="size-4 transition-transform group-data-expanded/details:rotate-90" />
            Technical details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="max-h-48 overflow-auto rounded-lg border border-border-subtle bg-card p-3 font-mono text-xs/relaxed text-muted-foreground">
              {details.stack}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        <PageStateMeta>
          <PageStateMetaItem
            label="Error ID"
            value={details.errorId}
            copyable
          />
          <PageStateMetaItem label="Service" value={details.service} />
          <PageStateMetaItem
            label="Time"
            value={formatTimestamp(details.occurredAt)}
          />
          <div className="ms-auto self-end">
            <LinkButton
              variant="link"
              size="sm"
              href={serverErrorCopy.statusHref}
              className="px-0"
            >
              <ActivityIcon data-icon="inline-start" /> Service status
            </LinkButton>
          </div>
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={41} spike={{ track: 1, at: 0.52 }}>
          <LogTrackMarker at={0.57} label="ANOMALY DETECTED" />
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { ServerError }
export type { ServerErrorProps }
