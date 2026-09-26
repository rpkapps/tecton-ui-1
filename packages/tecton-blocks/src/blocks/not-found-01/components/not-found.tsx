"use client"

import * as React from "react"
import { cn } from "cn"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  SearchIcon,
} from "lucide-react"

import { Button, LinkButton } from "@tecton/react/components/button"
import { Link } from "@tecton/react/tecton/link"
import { ShortcutKeys } from "@tecton/react/tecton/shortcuts"

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
import { notFoundCopy, notFoundRequest } from "../data"

type NotFoundProps = Omit<
  React.ComponentProps<typeof PageState>,
  "children"
> & {
  /** The requested path, shown in the diagnostics footer. */
  path?: string
  requestId?: string
  suggestions?: { label: string; href: string }[]
  onSearch?: () => void
}

/**
 * 404 page: the requested route does not exist. Offers the way back, the
 * command palette and, when the router can guess, the pages a stale link
 * most likely meant. The log figure stops at "TD": no data below.
 */
function NotFound({
  className,
  path = notFoundRequest.path,
  requestId = notFoundRequest.requestId,
  suggestions = notFoundRequest.suggestions,
  onSearch,
  ...props
}: NotFoundProps) {
  return (
    <PageState
      data-slot="not-found"
      tone="neutral"
      className={cn(className)}
      {...props}
    >
      <PageStateContent>
        <PageStateStatus label={notFoundCopy.status}>
          {notFoundCopy.protocol}
        </PageStateStatus>
        <PageStateCode>404</PageStateCode>
        <PageStateHeader>
          <PageStateTitle>{notFoundCopy.title}</PageStateTitle>
          <PageStateDescription>
            {notFoundCopy.description}
          </PageStateDescription>
        </PageStateHeader>
        <PageStateActions>
          <LinkButton href={notFoundCopy.homeHref}>
            <ArrowLeftIcon
              data-icon="inline-start"
              className="rtl:rotate-180"
            />{" "}
            Back to dashboard
          </LinkButton>
          <Button
            variant="outline"
            {...(onSearch === undefined ? {} : { onPress: onSearch })}
          >
            <SearchIcon data-icon="inline-start" />
            Search
            <ShortcutKeys keys="mod+k" className="ms-1" />
          </Button>
          <LinkButton variant="ghost" href={notFoundCopy.reportHref}>
            <FlagIcon data-icon="inline-start" /> Report broken link
          </LinkButton>
        </PageStateActions>
        {suggestions.length > 0 && (
          <div
            data-slot="not-found-suggestions"
            className="flex flex-col gap-2 text-sm"
          >
            <span className="text-xs text-muted-foreground">Did you mean</span>
            <ul className="flex flex-col gap-1.5">
              {suggestions.map((suggestion) => (
                <li key={suggestion.href}>
                  <Link
                    href={suggestion.href}
                    variant="muted"
                    className="gap-1.5"
                  >
                    <ChevronRightIcon className="text-muted-foreground rtl:rotate-180" />
                    {suggestion.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <PageStateMeta>
          <PageStateMetaItem
            label="Requested path"
            value={path}
            copyable
            className="max-w-full"
          />
          <PageStateMetaItem label="Request ID" value={requestId} copyable />
        </PageStateMeta>
      </PageStateContent>
      <PageStateFigure>
        <LogTrack seed={4} stopAt={0.58} depthFrom={1800} depthTo={3400}>
          <LogTrackMarker at={0.58} label="TD 2 730 m" />
          <LogTrackBand
            from={0.58}
            to={1}
            tone="muted"
            label="NO DATA BELOW TD"
          />
        </LogTrack>
      </PageStateFigure>
    </PageState>
  )
}

export { NotFound }
export type { NotFoundProps }
