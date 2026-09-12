import * as React from "react"
import { cn } from "cn"

/**
 * Layout primitives for the /compare state matrices. They mirror the Tecton
 * Storybook "variant matrix" stories: a CSS grid with an empty top-left cell,
 * small grey column captions, small grey row labels and one flex cell per
 * (row, column) pair. Dark-first, no colours of its own.
 */

type MatrixRow = {
  label: React.ReactNode
  cells: React.ReactNode[]
}

type MatrixProps = {
  /** Small heading rendered above the grid (e.g. "size=medium"). */
  title?: React.ReactNode
  /** Column captions; pass `[]` for a grid without a caption row. */
  columns: React.ReactNode[]
  rows: MatrixRow[]
  className?: string
  /** Extra classes for every cell (e.g. a fixed width). */
  cellClassName?: string
  /** Horizontal gap between columns, Tailwind gap-x class. */
  gapX?: string
}

function Matrix({
  title,
  columns,
  rows,
  className,
  cellClassName,
  gapX = "gap-x-8",
}: MatrixProps) {
  const columnCount = Math.max(
    columns.length,
    ...rows.map((row) => row.cells.length)
  )

  return (
    <section data-slot="matrix" className={cn("flex flex-col gap-3", className)}>
      {title !== undefined && (
        <h3
          data-slot="matrix-title"
          className="text-xs font-medium text-muted-foreground italic"
        >
          {title}
        </h3>
      )}
      <div
        data-slot="matrix-grid"
        className={cn("grid w-fit items-center gap-y-4", gapX)}
        style={{
          gridTemplateColumns: `max-content repeat(${columnCount}, max-content)`,
        }}
      >
        {columns.length > 0 && (
          <>
            <span aria-hidden />
            {columns.map((column, index) => (
              <ColumnHeader key={index}>{column}</ColumnHeader>
            ))}
          </>
        )}
        {rows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <RowLabel>{row.label}</RowLabel>
            {row.cells.map((cell, cellIndex) => (
              <Cell key={cellIndex} className={cellClassName}>
                {cell}
              </Cell>
            ))}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}

function ColumnHeader({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="matrix-column"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function RowLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="matrix-row"
      className={cn("pr-4 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function Cell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="matrix-cell"
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  )
}

/** A titled group of matrices (Storybook's "Outlined" / "Filled" headings). */
function Section({
  title,
  eyebrow,
  className,
  children,
}: {
  title?: React.ReactNode
  /** Uppercase tracking caption used by some stories ("EXTENDED", "ROUND"). */
  eyebrow?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section
      data-slot="matrix-section"
      className={cn("flex flex-col gap-5", className)}
    >
      {title !== undefined && (
        <h2
          className={cn(
            eyebrow
              ? "text-xs font-medium tracking-widest text-muted-foreground uppercase"
              : "text-lg font-medium text-foreground"
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

/** Small grey footnote (Storybook's "Hover, Pressed and Focus are forced…"). */
function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="matrix-caption"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Vertical stack of sections with the spacing used across all pages. */
function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="matrix-page"
      className={cn("flex flex-col gap-10", className)}
      {...props}
    />
  )
}

export { Matrix, Cell, ColumnHeader, RowLabel, Section, Caption, Page }
export type { MatrixProps, MatrixRow }
