"use client"

/**
 * A query drawn in the syntax colours: the mirror over the query field's
 * input (`QueryMirror`), whose text is transparent so the caret and the
 * selection stay the input's own, and the examples of the help
 * (`QueryText`). Only colour and decoration change between the spans,
 * never a glyph's width, so the mirror's letters stay over the input's.
 */
import * as React from "react"
import { cn } from "cn"

import { Tooltip, TooltipContent, TooltipTrigger } from "@tecton/react/tooltip"

import type { ParsedQuery, QuerySpanKind } from "./engine/query/index"

/** Tecton palette steps: a step is the same contrast in both themes. */
const SPAN_CLASS: Record<QuerySpanKind | "plain", string> = {
  key: "text-blue-830",
  colon: "text-muted-foreground",
  operator: "text-orchid-830",
  value: "text-foreground",
  separator: "text-muted-foreground",
  empty: "text-saffron-830",
  preset: "text-green-830",
  text: "text-foreground",
  keyword: "text-violet-830",
  plain: "text-foreground",
}

type Segment = { start: number; end: number; kind: QuerySpanKind | "plain" }

/** The query's text from `from` to `to` cut at its spans; gaps are plain. */
function segmentsOf(parsed: ParsedQuery, from: number, to: number) {
  const out: Array<Segment> = []
  let at = from
  for (const span of parsed.spans) {
    if (span.end <= from || span.start >= to) continue
    const start = Math.max(span.start, at)
    const end = Math.min(span.end, to)
    if (end <= start) continue
    if (start > at) out.push({ start: at, end: start, kind: "plain" })
    out.push({ start, end, kind: span.kind })
    at = end
  }
  if (at < to) out.push({ start: at, end: to, kind: "plain" })
  return out
}

function Segments({
  parsed,
  from,
  to,
}: {
  parsed: ParsedQuery
  from: number
  to: number
}) {
  return segmentsOf(parsed, from, to).map((segment) => (
    <span key={segment.start} className={SPAN_CLASS[segment.kind]}>
      {parsed.text.slice(segment.start, segment.end)}
    </span>
  ))
}

/** A query in the syntax colours, as text (an example of the help). */
function QueryText({
  parsed,
  className,
}: {
  parsed: ParsedQuery
  className?: string
}) {
  return (
    <span
      data-slot="data-table-query-text"
      className={cn("whitespace-pre", className)}
    >
      <Segments parsed={parsed} from={0} to={parsed.text.length} />
    </span>
  )
}

/** A stretch of the query with a problem, and its message. */
type QueryProblem = {
  readonly start: number
  readonly end: number
  readonly message: string
}

/**
 * The mirror's content: the query's segments, each problem shown (after a
 * pause in typing, `QuerySearch`) with a wavy underline in the error colour
 * and its message on a tooltip. A problem takes the pointer (the rest of the
 * mirror lets it through to the input): a press on it puts the input's
 * caret where it landed.
 */
function MirrorText({
  parsed,
  problems,
  openProblem,
  onPlaceCaret,
}: {
  parsed: ParsedQuery
  problems: ReadonlyArray<QueryProblem>
  /** The problem whose tooltip shows without hover: the caret is in it. */
  openProblem: QueryProblem | null
  onPlaceCaret: (offset: number) => void
}) {
  const out: Array<React.ReactNode> = []
  let at = 0
  for (const problem of problems) {
    if (problem.start < at || problem.end <= problem.start) continue
    if (problem.start > at)
      out.push(
        <Segments key={`s${at}`} parsed={parsed} from={at} to={problem.start} />
      )
    out.push(
      <ProblemRun
        key={`p${problem.start}`}
        problem={problem}
        open={openProblem === problem}
        onPlaceCaret={onPlaceCaret}
      >
        <Segments parsed={parsed} from={problem.start} to={problem.end} />
      </ProblemRun>
    )
    at = problem.end
  }
  if (at < parsed.text.length)
    out.push(
      <Segments
        key={`s${at}`}
        parsed={parsed}
        from={at}
        to={parsed.text.length}
      />
    )
  return out
}

function ProblemRun({
  problem,
  open,
  onPlaceCaret,
  children,
}: {
  problem: QueryProblem
  open: boolean
  onPlaceCaret: (offset: number) => void
  children: React.ReactNode
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <Tooltip open={hovered || open} onOpenChange={setHovered}>
      <TooltipTrigger
        render={
          <span
            data-slot="data-table-query-problem"
            className="pointer-events-auto cursor-text underline decoration-destructive decoration-wavy decoration-from-font underline-offset-[3px] [text-decoration-skip-ink:none]"
            onMouseDown={(event) => {
              // The caret goes where the press landed, in the input below.
              event.preventDefault()
              const doc = document as {
                caretPositionFromPoint?: (
                  x: number,
                  y: number
                ) => { offsetNode: Node; offset: number } | null
              }
              let offset = problem.end
              const position = doc.caretPositionFromPoint?.(
                event.clientX,
                event.clientY
              )
              if (
                position &&
                event.currentTarget.contains(position.offsetNode)
              ) {
                const range = document.createRange()
                range.setStart(event.currentTarget, 0)
                range.setEnd(position.offsetNode, position.offset)
                offset = problem.start + range.toString().length
              }
              onPlaceCaret(offset)
            }}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-80 text-pretty">
        {problem.message}
      </TooltipContent>
    </Tooltip>
  )
}

export { MirrorText, QueryText, SPAN_CLASS }
export type { QueryProblem }
