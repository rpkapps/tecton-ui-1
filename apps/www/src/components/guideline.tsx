import * as React from "react"
import { cn } from "cn"
import { CheckIcon, CloseIcon } from "@tecton/react/icons"

import { Badge } from "@tecton/react/components/badge"

/**
 * The MDX components of the "## Usage guidelines" section, emitted by
 * apps/www/scripts/sync-guidelines.mts from packages/tecton-react/guidelines/*.md.
 *
 * Everything here is plain layout on top of semantic tokens (`success` for a
 * Do, `destructive` for a Don't), so both modes follow globals.css and no rule
 * has to be added to app.css. The text stays inside the typeset prose — only
 * the icon rows and the severity badge opt out with `data-not-typeset`.
 */

/* ------------------------------------------------------------------------ */
/* Do                                                                        */
/* ------------------------------------------------------------------------ */

/** The "### Do" list: a check mark in place of each bullet. */
export function DoList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="do-list"
      className={cn("list-none ps-0", className)}
      {...props}
    />
  )
}

/** One "### Do" bullet. Children are markdown, so they stay typeset. */
export function Do({
  className,
  children,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="do"
      className={cn("flex gap-2.5 ps-0", className)}
      {...props}
    >
      <CheckIcon
        aria-hidden="true"
        className="mt-1.5 size-4 shrink-0 text-success"
      />
      <div className="min-w-0 flex-1 [&>*:first-child]:mt-0">{children}</div>
    </li>
  )
}

/* ------------------------------------------------------------------------ */
/* Don't                                                                     */
/* ------------------------------------------------------------------------ */

export type DontSeverity = "CRITICAL" | "HIGH" | "MEDIUM"

const severityVariant = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "secondary",
} as const satisfies Record<
  DontSeverity,
  React.ComponentProps<typeof Badge>["variant"]
>

/** One "### Don't" entry: the title, its severity, and the Wrong/Correct pair. */
export function Dont({
  severity = "MEDIUM",
  title,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  severity?: DontSeverity
  title?: React.ReactNode
}) {
  return (
    <div
      data-slot="dont"
      data-severity={severity}
      className={cn("mt-8", className)}
      {...props}
    >
      <div
        data-not-typeset
        className="flex flex-wrap items-center gap-x-2 gap-y-1"
      >
        <CloseIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-destructive"
        />
        <span className="font-medium">{title}</span>
        <Badge variant={severityVariant[severity]} appearance="outline">
          {severity}
        </Badge>
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Wrong / Correct                                                           */
/* ------------------------------------------------------------------------ */

/**
 * A labelled code block. The fence itself is still rendered by the `pre`/
 * `figure` MDX components, so shiki highlighting (and the copy button, where
 * the pipeline wraps a fence in a figure) is untouched; only the block's flow
 * margins are pulled in so it sits under its label.
 */
function Example({
  tone,
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone: "wrong" | "correct"; label: string }) {
  const wrong = tone === "wrong"
  const Icon = wrong ? CloseIcon : CheckIcon
  return (
    <div
      data-slot={tone}
      className={cn(
        "mt-4 border-l-2 pl-3 [&>figure]:mx-0 [&>figure]:mt-2 [&>pre]:mt-2",
        wrong ? "border-destructive" : "border-success",
        className
      )}
      {...props}
    >
      <div
        data-not-typeset
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase",
          wrong ? "text-destructive" : "text-success"
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </div>
      {children}
    </div>
  )
}

/** The counter-example of a Don't entry. */
export function Wrong(props: React.ComponentProps<"div">) {
  return <Example tone="wrong" label="Wrong" {...props} />
}

/** The replacement of a Don't entry. */
export function Correct(props: React.ComponentProps<"div">) {
  return <Example tone="correct" label="Correct" {...props} />
}
