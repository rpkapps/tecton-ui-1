"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  BellIcon,
  BellRingIcon,
  ConstructionIcon,
} from "lucide-react"

import { Button, LinkButton } from "@tecton/react/components/button"

import { LogTrack, LogTrackBand, LogTrackMarker } from "./components/log-track"
import {
  PageState,
  PageStateActions,
  PageStateContent,
  PageStateDescription,
  PageStateFigure,
  PageStateHeader,
  PageStateMeta,
  PageStateMetaItem,
  PageStateStatus,
  PageStateTitle,
} from "./components/page-state"
import { comingSoon } from "./data"

/**
 * The page-state scaffold on its own: status row, title, description,
 * actions and diagnostics next to the well-log figure. This demo shows a
 * page that is not available yet; the 404 / 403 / 401 / 500 / 503 /
 * offline blocks build on the same parts.
 */
export default function ComingSoonPage() {
  const [subscribed, setSubscribed] = React.useState(false)
  return (
    <PageState tone="info">
      <PageStateContent>
        <PageStateStatus label="Coming soon">In progress</PageStateStatus>
        <PageStateHeader>
          <PageStateTitle>{comingSoon.title}</PageStateTitle>
          <PageStateDescription>{comingSoon.description}</PageStateDescription>
        </PageStateHeader>
        <PageStateActions>
          <LinkButton href="/">
            <ArrowLeftIcon
              data-icon="inline-start"
              className="rtl:rotate-180"
            />{" "}
            Back to home
          </LinkButton>
          <Button
            variant={subscribed ? "secondary" : "outline"}
            onPress={() => setSubscribed((value) => !value)}
          >
            {subscribed ? (
              <BellRingIcon data-icon="inline-start" />
            ) : (
              <BellIcon data-icon="inline-start" />
            )}
            {subscribed ? "We'll let you know" : "Notify me when it's ready"}
          </Button>
        </PageStateActions>
        <PageStateMeta>
          <PageStateMetaItem label="Route" value={comingSoon.route} copyable />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={11} fadeFrom={0.45}>
          <LogTrackMarker at={0.45} label="IN PROGRESS" />
          <LogTrackBand
            from={0.45}
            to={1}
            pattern="solid"
            tone="muted"
            label="NOT YET AVAILABLE"
          >
            <ConstructionIcon width={28} height={28} strokeWidth={1.5} />
          </LogTrackBand>
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export {
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
  pageStateVariants,
} from "./components/page-state"
export type { PageStateTone } from "./components/page-state"
export {
  LogTrack,
  LogTrackBand,
  LogTrackMarker,
  useLogTrack,
} from "./components/log-track"
export type { LogTrackProps } from "./components/log-track"
export { comingSoon, formatTimestamp } from "./data"
