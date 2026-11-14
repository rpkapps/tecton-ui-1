"use client"

/**
 * The query field's help: its "?" button, in the field, and the popover it
 * opens, with an example for each of the table's filterable columns (made
 * from its key, its type and its data), free text and "No value", in the
 * syntax colours. Choosing an example (a press anywhere in its row, or its
 * button from the keyboard) adds it to the query.
 */
import * as React from "react"
import { CircleHelpIcon } from "lucide-react"

import { InputGroupButton } from "@tecton/react/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@tecton/react/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@tecton/react/tooltip"

import type { Translator } from "../i18n/translations"
import type { ParsedQuery } from "./engine/query/index"
import { QueryText } from "./query-text"

type Example = { readonly parsed: ParsedQuery; readonly finds: string }

function QueryHelp({
  open,
  onOpenChange,
  examples,
  keys,
  onExample,
  finalFocus,
  popupRef,
  t,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean, details: { reason: string }) => void
  examples: ReadonlyArray<Example>
  /** The keys of the filterable columns, for the footer. */
  keys: ReadonlyArray<string>
  onExample: (query: string) => void
  /** Where focus goes once the popover closes. */
  finalFocus: () => HTMLElement | boolean | null
  /** The popover's element: focus in it is still the field's. */
  popupRef: React.Ref<HTMLDivElement>
  t: Translator<"dataTableQuery">
  /** The button's name and the popover's title. */
  title: string
}) {
  const id = React.useId()
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <InputGroupButton
                  size="icon-xs"
                  aria-label={title}
                  data-slot="data-table-query-help"
                />
              }
            />
          }
        >
          <CircleHelpIcon aria-hidden />
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={10}
        alignOffset={-6}
        finalFocus={finalFocus}
        ref={popupRef}
        data-slot="data-table-query-help-content"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="w-[min(32rem,calc(100vw-2rem))] gap-3 p-0"
      >
        {/* Plain elements, as the popover's header, title and description
            draw them: the parts a table already bundles stay its only
            ones (a part used only here would join the table's chunk). */}
        <div className="flex flex-col gap-1 px-4 pt-4 text-sm">
          <h2 id={`${id}-title`} className="font-medium">
            {title}
          </h2>
          <p id={`${id}-description`} className="text-muted-foreground">
            {t("helpDescription")}
          </p>
        </div>
        <div className="max-h-[min(24rem,calc(var(--available-height)-9rem))] overflow-y-auto px-2">
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-2">{t("helpExample")}</TableHead>
                <TableHead>{t("helpFinds")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examples.map((example, index) => (
                // The whole row is the example's button: its press area
                // stretched over the row (the row is its containing block),
                // its focus ring around the row, what it finds its
                // description. One button per row, nothing nested in it;
                // a press the stretch misses (a layout without it) is the
                // row's own and does the same.
                <TableRow
                  key={example.parsed.text}
                  data-slot="data-table-query-help-row"
                  className="relative"
                  onClick={(event) => {
                    if (!(event.target as Element).closest("button"))
                      onExample(example.parsed.text)
                  }}
                >
                  <TableCell className="py-0.5 ps-0">
                    <button
                      type="button"
                      aria-describedby={`${id}-finds-${index}`}
                      className="rounded-sm px-2 py-1 text-start font-mono text-xs outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                      onClick={() => onExample(example.parsed.text)}
                    >
                      <QueryText parsed={example.parsed} />
                    </button>
                  </TableCell>
                  <TableCell
                    id={`${id}-finds-${index}`}
                    className="whitespace-normal text-muted-foreground"
                  >
                    {example.finds}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-1.5 border-t bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <p>
            {keys.map((key, index) => (
              <React.Fragment key={key}>
                {index > 0 && ", "}
                <code className="font-mono text-blue-830">{key}</code>
              </React.Fragment>
            ))}
          </p>
          <p>{t("helpFooter")}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { QueryHelp }
