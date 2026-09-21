"use client"

import * as React from "react"
import { cn } from "cn"
import { ApartmentIcon, LoginIcon, SaveIcon } from "@tecton/react/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { LinkButton } from "@tecton/react/components/button"

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
import { sessionContext, sessionExpiredCopy } from "../data"

type SessionExpiredProps = Omit<
  React.ComponentProps<typeof PageState>,
  "children"
> & {
  signedInAs?: string
  expiredAt?: string
  returnTo?: string
  pendingEdits?: number
}

/**
 * 401 page: the session timed out. Reassures about unsaved edits, offers
 * password and SSO sign-in and returns the user to where they were. The
 * log fades past the moment the session ended.
 */
function SessionExpired({
  className,
  signedInAs = sessionContext.signedInAs,
  expiredAt = sessionContext.expiredAt,
  returnTo = sessionContext.returnTo,
  pendingEdits = sessionContext.pendingEdits,
  ...props
}: SessionExpiredProps) {
  const time = formatTimestamp(expiredAt)
  return (
    <PageState
      data-slot="session-expired"
      tone="info"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={sessionExpiredCopy.status}>
          {sessionExpiredCopy.protocol}
        </PageStateStatus>
        <PageStateCode>401</PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{sessionExpiredCopy.title}</PageStateTitle>
          <PageStateDescription>
            {sessionExpiredCopy.description}
          </PageStateDescription>
        </PageStateHeader>
        {pendingEdits > 0 && (
          <Alert variant="info" appearance="outline">
            <SaveIcon />
            <AlertTitle>
              {pendingEdits} unsaved{" "}
              {pendingEdits === 1 ? "edit is" : "edits are"} kept on this device
            </AlertTitle>
            <AlertDescription>
              They're saved as soon as you sign in again.
            </AlertDescription>
          </Alert>
        )}
        <PageStateActions>
          <LinkButton href={sessionExpiredCopy.signInHref}>
            <LoginIcon data-icon="inline-start" /> Sign in again
          </LinkButton>
          <LinkButton variant="secondary" href={sessionExpiredCopy.ssoHref}>
            <ApartmentIcon data-icon="inline-start" /> Continue with{" "}
            {sessionExpiredCopy.ssoProvider}
          </LinkButton>
        </PageStateActions>
        <PageStateMeta>
          <PageStateMetaItem label="Signed in as" value={signedInAs} />
          <PageStateMetaItem label="Session ended" value={time} />
          <PageStateMetaItem
            label="Return to"
            value={returnTo}
            copyable
            className="max-w-full"
          />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={17} fadeFrom={0.62}>
          <LogTrackMarker
            at={0.62}
            label={`SESSION ENDED ${time.slice(11, 16)}`}
          />
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { SessionExpired }
export type { SessionExpiredProps }
