"use client"

import * as React from "react"
import { cn } from "cn"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Chip, ChipGroup, ChipList, ChipTag } from "@tecton/react/tecton/chip"
import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"
import { TextField, TextFieldInput } from "@tecton/react/tecton/text-field"

import { fields, statusMeta, typeMeta, type WellStatus, type WellType } from "../data"

export type WellsFilter = {
  query: string
  field: string
  type: WellType | "all"
  statuses: WellStatus[]
}

export const emptyFilter: WellsFilter = {
  query: "",
  field: "all",
  type: "all",
  statuses: [],
}

type WellsFilterBarProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value: WellsFilter
  onChange: (next: WellsFilter) => void
  /** Number of rows matching the current filter. */
  resultCount?: number
}

function WellsFilterBar({
  className,
  value,
  onChange,
  resultCount,
  ...props
}: WellsFilterBarProps) {
  const set = <K extends keyof WellsFilter>(key: K, next: WellsFilter[K]) =>
    onChange({ ...value, [key]: next })

  const toggleStatus = (status: WellStatus) =>
    set(
      "statuses",
      value.statuses.includes(status)
        ? value.statuses.filter((item) => item !== status)
        : [...value.statuses, status]
    )

  const active =
    value.query.trim() !== "" ||
    value.field !== "all" ||
    value.type !== "all" ||
    value.statuses.length > 0

  return (
    <div
      data-slot="wells-filter-bar"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <TextField
          aria-label="Search wells"
          className="md:max-w-xs"
          value={value.query}
          onChange={(next) => set("query", next)}
        >
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <TextFieldInput placeholder="Search by name, rig or operator…" className="pl-8" />
          </div>
        </TextField>
        <SelectField
          aria-label="Field"
          className="md:w-48"
          selectedKey={value.field}
          onSelectionChange={(key) => set("field", String(key))}
        >
          <SelectFieldItem id="all" textValue="All fields">
            All fields
          </SelectFieldItem>
          {fields.map((field) => (
            <SelectFieldItem key={field} id={field} textValue={field}>
              {field}
            </SelectFieldItem>
          ))}
        </SelectField>
        <SelectField
          aria-label="Well type"
          className="md:w-44"
          selectedKey={value.type}
          onSelectionChange={(key) => set("type", String(key) as WellsFilter["type"])}
        >
          <SelectFieldItem id="all" textValue="All types">
            All types
          </SelectFieldItem>
          {(Object.keys(typeMeta) as WellType[]).map((type) => (
            <SelectFieldItem key={type} id={type} textValue={typeMeta[type]}>
              {typeMeta[type]}
            </SelectFieldItem>
          ))}
        </SelectField>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="md:ml-auto"
            onPress={() => onChange(emptyFilter)}
          >
            <XIcon /> Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status filters">
          {(Object.keys(statusMeta) as WellStatus[]).map((status) => {
            const selected = value.statuses.includes(status)
            return (
              <Chip
                key={status}
                size="sm"
                color={selected ? statusMeta[status].color : "default"}
                variant={selected ? "filled" : "outlined"}
                aria-pressed={selected}
                onPress={() => toggleStatus(status)}
              >
                {statusMeta[status].label}
              </Chip>
            )
          })}
        </div>
        {value.statuses.length > 0 && (
          <ChipGroup
            aria-label="Active status filters"
            className="ml-auto"
            onRemove={(keys) =>
              set(
                "statuses",
                value.statuses.filter((status) => !keys.has(status))
              )
            }
          >
            <ChipList>
              {value.statuses.map((status) => (
                <ChipTag key={status} id={status} size="xs" textValue={statusMeta[status].label}>
                  {statusMeta[status].label}
                </ChipTag>
              ))}
            </ChipList>
          </ChipGroup>
        )}
        {typeof resultCount === "number" && (
          <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
            {resultCount} {resultCount === 1 ? "well" : "wells"}
          </span>
        )}
      </div>
    </div>
  )
}

export { WellsFilterBar }
export type { WellsFilterBarProps }
