"use client"

import * as React from "react"
import { cn } from "cn"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Textarea } from "@tecton/react/components/textarea"

import { defaultWellHeader, operators, rigs, wellTypes } from "../data"
import type { WellHeader, WellType } from "../data"

type WellHeaderFormProps = Omit<React.ComponentProps<"form">, "onChange"> & {
  value?: WellHeader
  onChange?: (next: WellHeader) => void
}

/** Section of a data-entry form: legend and description on the left, fields on the right from `md`. */
function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <FieldSet
      data-slot="form-section"
      className={cn("grid gap-4 md:grid-cols-[14rem_1fr] md:gap-8", className)}
    >
      <div className="flex flex-col gap-1">
        <FieldLegend variant="label" className="mb-0">
          {title}
        </FieldLegend>
        {description ? (
          <FieldDescription className="text-xs">{description}</FieldDescription>
        ) : null}
      </div>
      <FieldGroup className="max-w-xl">{children}</FieldGroup>
    </FieldSet>
  )
}

/**
 * Well header data entry: identity, location, timing and the well type.
 * Controlled through `value` / `onChange`; falls back to internal state.
 */
function WellHeaderForm({
  className,
  value: controlled,
  onChange,
  ...props
}: WellHeaderFormProps) {
  const id = React.useId()
  const [internal, setInternal] = React.useState<WellHeader>(defaultWellHeader)
  const value = controlled ?? internal
  const set = <TKey extends keyof WellHeader>(
    key: TKey,
    next: WellHeader[TKey]
  ) => {
    const merged = { ...value, [key]: next }
    setInternal(merged)
    onChange?.(merged)
  }

  return (
    <form
      data-slot="well-header-form"
      className={cn("flex flex-col gap-8", className)}
      onSubmit={(event) => event.preventDefault()}
      {...props}
    >
      <FormSection
        title="Identity"
        description="How the well appears in the explorer and in reports."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Well name</FieldLabel>
            <Input
              id={`${id}-name`}
              value={value.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-field`}>Field</FieldLabel>
            <Input
              id={`${id}-field`}
              value={value.field}
              onChange={(event) => set("field", event.target.value)}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`${id}-operator`}>Operator</FieldLabel>
          <Select
            id={`${id}-operator`}
            value={value.operator}
            onValueChange={(next) => {
              if (next !== null) set("operator", next)
            }}
            items={operators.map((operator) => ({
              value: operator.id,
              label: operator.label,
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <FormSection
        title="Schedule and location"
        description="Planned spud and the water depth at the surface location."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-rig`}>Rig</FieldLabel>
            <Select
              id={`${id}-rig`}
              value={value.rig}
              onValueChange={(next) => {
                if (next !== null) set("rig", next)
              }}
              items={rigs.map((rig) => ({ value: rig.id, label: rig.label }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rigs.map((rig) => (
                  <SelectItem key={rig.id} value={rig.id}>
                    {rig.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-spud`}>Spud date</FieldLabel>
            <Input
              id={`${id}-spud`}
              type="date"
              value={value.spudDate}
              onChange={(event) => set("spudDate", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-wd`}>Water depth</FieldLabel>
            <Input
              id={`${id}-wd`}
              type="number"
              inputMode="decimal"
              className="font-mono"
              value={value.waterDepth}
              onChange={(event) => set("waterDepth", event.target.value)}
            />
            <FieldDescription>Metres below mean sea level.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-td`}>Planned TD</FieldLabel>
            <Input
              id={`${id}-td`}
              type="number"
              inputMode="decimal"
              className="font-mono"
              value={value.plannedTd}
              onChange={(event) => set("plannedTd", event.target.value)}
            />
            <FieldDescription>Metres TVD.</FieldDescription>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Well type"
        description="Drives the default design criteria and the reporting template."
      >
        <RadioGroup
          aria-label="Well type"
          value={value.type}
          onValueChange={(next) => set("type", next as WellType)}
          className="gap-3"
        >
          {wellTypes.map((type) => (
            <Field
              key={type.id}
              orientation="horizontal"
              className="items-start"
            >
              <RadioGroupItem
                value={type.id}
                id={`${id}-type-${type.id}`}
                className="mt-0.5"
              />
              <FieldContent>
                <Label htmlFor={`${id}-type-${type.id}`}>{type.label}</Label>
                <FieldDescription className="text-xs">
                  {type.description}
                </FieldDescription>
              </FieldContent>
            </Field>
          ))}
        </RadioGroup>
      </FormSection>

      <FormSection
        title="Notes"
        description="Free text carried into the well summary."
      >
        <Field>
          <FieldLabel htmlFor={`${id}-notes`} className="sr-only">
            Notes
          </FieldLabel>
          <Textarea
            id={`${id}-notes`}
            rows={4}
            placeholder="Objectives, constraints, partner requirements…"
            value={value.notes}
            onChange={(event) => set("notes", event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}

export { WellHeaderForm, FormSection }
export type { WellHeaderFormProps }
