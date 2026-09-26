"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CircleCheckIcon,
  LockIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tecton/react/components/field"
import { Spinner } from "@tecton/react/components/spinner"
import { Textarea } from "@tecton/react/components/textarea"
import { LinkButton } from "@tecton/react/tecton/link"

import {
  LogTrack,
  LogTrackBand,
  LogTrackMarker,
} from "../../page-state/components/log-track"
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
import { forbiddenContext, forbiddenCopy, validateReason } from "../data"

type ForbiddenProps = Omit<
  React.ComponentProps<typeof PageState>,
  "children"
> & {
  signedInAs?: string
  requestId?: string
  onRequestAccess?: (reason: string) => void
}

/**
 * 403 page: the signed-in user may not open this page. Carries an
 * inline access request (reason → approver) instead of sending the user
 * elsewhere, plus the way to switch account. The figure locks the lower
 * interval of the log.
 */
function Forbidden({
  className,
  signedInAs = forbiddenContext.signedInAs,
  requestId = forbiddenContext.requestId,
  onRequestAccess,
  ...props
}: ForbiddenProps) {
  const [reason, setReason] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent">(
    "idle"
  )
  const reasonId = React.useId()
  const error = submitted ? validateReason(reason) : undefined

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (validateReason(reason)) return
    setStatus("sending")
    window.setTimeout(() => {
      setStatus("sent")
      onRequestAccess?.(reason)
    }, 700)
  }

  return (
    <PageState
      data-slot="forbidden"
      tone="warning"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={forbiddenCopy.status}>
          {forbiddenCopy.protocol}
        </PageStateStatus>
        <PageStateCode>403</PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{forbiddenCopy.title}</PageStateTitle>
          <PageStateDescription>
            {forbiddenCopy.description}
          </PageStateDescription>
        </PageStateHeader>

        {status === "sent" ? (
          <Alert variant="success" appearance="outline">
            <CircleCheckIcon />
            <AlertTitle>Request sent</AlertTitle>
            <AlertDescription>
              You will get an email when access is granted. Requests are usually
              answered within one working day.
            </AlertDescription>
          </Alert>
        ) : (
          <form
            data-slot="forbidden-request"
            method="post"
            className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-card p-4"
            onSubmit={submit}
            noValidate
          >
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor={reasonId}>Request access</FieldLabel>
              <Textarea
                id={reasonId}
                name="reason"
                rows={3}
                placeholder="What do you need it for?"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={
                  error
                    ? `${reasonId}-description ${reasonId}-error`
                    : `${reasonId}-description`
                }
              />
              <FieldDescription id={`${reasonId}-description`}>
                Your request goes to the person who manages access.
              </FieldDescription>
              <FieldError id={`${reasonId}-error`}>{error}</FieldError>
            </Field>
            <PageStateActions>
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? (
                  <Spinner />
                ) : (
                  <SendIcon data-icon="inline-start" />
                )}
                Send request
              </Button>
              <LinkButton
                variant="ghost"
                href={forbiddenCopy.switchAccountHref}
              >
                <UserRoundIcon data-icon="inline-start" /> Switch account
              </LinkButton>
            </PageStateActions>
          </form>
        )}

        <PageStateMeta>
          <PageStateMetaItem label="Signed in as" value={signedInAs} />
          <PageStateMetaItem label="Request ID" value={requestId} copyable />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={23} stopAt={0.36}>
          <LogTrackMarker at={0.36} label="CLEARANCE REQUIRED" />
          <LogTrackBand
            from={0.36}
            to={1}
            pattern="solid"
            label="RESTRICTED INTERVAL"
          >
            <LockIcon width={28} height={28} strokeWidth={1.5} />
          </LogTrackBand>
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { Forbidden }
export type { ForbiddenProps }
