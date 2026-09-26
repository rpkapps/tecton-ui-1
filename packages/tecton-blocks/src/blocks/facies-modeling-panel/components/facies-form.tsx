"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon, DicesIcon, SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Separator } from "@tecton/react/components/separator"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import {
  densityLabel,
  faciesTemplates,
  inputData,
  methods,
  targetSurfaces,
  volumes,
} from "../data"
import type { FaciesSettings } from "../data"
import { ParameterSlider } from "./parameter-slider"

type FaciesFormProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value: FaciesSettings
  onChange: (next: FaciesSettings) => void
}

function FaciesForm({ className, value, onChange, ...props }: FaciesFormProps) {
  const id = React.useId()

  const set = <TKey extends keyof FaciesSettings>(
    key: TKey,
    next: FaciesSettings[TKey]
  ) => onChange({ ...value, [key]: next })

  const setVariogram = (key: keyof FaciesSettings["variogram"], next: number) =>
    set("variogram", { ...value.variogram, [key]: next })

  const setOption = (key: keyof FaciesSettings["options"], next: boolean) =>
    set("options", { ...value.options, [key]: next })

  const setDensity = (lithotypeId: string, density: number) =>
    set(
      "lithotypes",
      value.lithotypes.map((lithotype) =>
        lithotype.id === lithotypeId ? { ...lithotype, density } : lithotype
      )
    )

  return (
    <div
      data-slot="facies-form"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <Field>
        <FieldLabel htmlFor={`${id}-name`}>Model name</FieldLabel>
        <Input
          id={`${id}-name`}
          variant="filled"
          value={value.modelName}
          onChange={(event) => set("modelName", event.target.value)}
        />
      </Field>

      <FormSection title="Parameters" defaultExpanded>
        <SelectField
          label="Facies template"
          value={value.templateId}
          onValueChange={(next) => set("templateId", next)}
          items={faciesTemplates.map((template) => ({
            value: template.id,
            label: (
              <>
                <ColorSwatch color={template.color} size="xs" shape="square" />
                {template.name}
              </>
            ),
          }))}
        />
        <SelectField
          label="Input data"
          value={value.inputDataId}
          onValueChange={(next) => set("inputDataId", next)}
          items={toItems(inputData)}
        />
        <SelectField
          label="Target surface"
          value={value.targetSurfaceId}
          onValueChange={(next) => set("targetSurfaceId", next)}
          items={toItems(targetSurfaces)}
        />
        <SelectField
          label="Volume"
          value={value.volumeId}
          onValueChange={(next) => set("volumeId", next)}
          items={toItems(volumes)}
        />
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <SelectField
            label="Method"
            value={value.methodId}
            onValueChange={(next) => set("methodId", next)}
            items={toItems(methods)}
          />
          <Field className="w-24">
            <FieldLabel htmlFor={`${id}-realizations`}>Realizations</FieldLabel>
            <Input
              id={`${id}-realizations`}
              variant="filled"
              type="number"
              className="font-mono tabular-nums"
              value={String(value.realizations)}
              onChange={(event) =>
                set(
                  "realizations",
                  Math.max(1, Number(event.target.value) || 1)
                )
              }
            />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <Field data-disabled={value.options.lockSeed}>
            <FieldLabel htmlFor={`${id}-seed`}>Seed</FieldLabel>
            <Input
              id={`${id}-seed`}
              variant="filled"
              className="font-mono tabular-nums"
              value={value.seed}
              disabled={value.options.lockSeed}
              onChange={(event) =>
                set("seed", event.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
          <Button
            variant="outline"
            size="icon"
            aria-label="Randomise seed"
            disabled={value.options.lockSeed}
            onClick={() =>
              set("seed", String(Math.floor(Math.random() * 90000) + 10000))
            }
          >
            <DicesIcon />
          </Button>
        </div>
      </FormSection>

      <FormSection title="Variogram" defaultExpanded>
        <ParameterSlider
          label="Major range"
          value={value.variogram.major}
          min={100}
          max={5000}
          step={50}
          unit="m"
          onValueChange={(next) => setVariogram("major", next)}
        />
        <ParameterSlider
          label="Minor range"
          value={value.variogram.minor}
          min={50}
          max={2500}
          step={25}
          unit="m"
          onValueChange={(next) => setVariogram("minor", next)}
        />
        <ParameterSlider
          label="Vertical range"
          value={value.variogram.vertical}
          min={1}
          max={60}
          step={1}
          unit="m"
          onValueChange={(next) => setVariogram("vertical", next)}
        />
        <div className="grid grid-cols-2 gap-4">
          <ParameterSlider
            label="Nugget"
            value={value.variogram.nugget}
            min={0}
            max={1}
            step={0.05}
            valueLabel={value.variogram.nugget.toFixed(2)}
            onValueChange={(next) => setVariogram("nugget", next)}
          />
          <ParameterSlider
            label="Sill"
            value={value.variogram.sill}
            min={0}
            max={2}
            step={0.05}
            valueLabel={value.variogram.sill.toFixed(2)}
            onValueChange={(next) => setVariogram("sill", next)}
          />
        </div>
      </FormSection>

      <FormSection title="Lithotype density" defaultExpanded>
        {value.lithotypes.map((lithotype) => (
          <ParameterSlider
            key={lithotype.id}
            label={lithotype.name}
            adornment={
              <ColorSwatch
                color={lithotype.color}
                size="xs"
                shape="square"
                aria-label={`${lithotype.name} colour`}
              />
            }
            value={lithotype.density}
            min={0}
            max={100}
            step={5}
            valueLabel={densityLabel(lithotype.density)}
            onValueChange={(next) => setDensity(lithotype.id, next)}
          />
        ))}
        <p className="text-xs text-muted-foreground">
          Total proportion{" "}
          <span className="font-mono tabular-nums">
            {value.lithotypes.reduce((sum, item) => sum + item.density, 0)}%
          </span>
        </p>
      </FormSection>

      <FormSection title="Options">
        <OptionCheckbox
          title="Condition to wells"
          description="Honour facies logs at 12 wells."
          checked={value.options.conditionToWells}
          onCheckedChange={(next) => setOption("conditionToWells", next)}
        />
        <OptionCheckbox
          title="Honour vertical proportion trends"
          description="Use the input data as a soft probability trend."
          checked={value.options.honourTrends}
          onCheckedChange={(next) => setOption("honourTrends", next)}
        />
        <OptionCheckbox
          title="Lock seed"
          checked={value.options.lockSeed}
          onCheckedChange={(next) => setOption("lockSeed", next)}
        />
        <OptionCheckbox
          title="Export all realizations to the project"
          checked={value.options.exportRealizations}
          onCheckedChange={(next) => setOption("exportRealizations", next)}
        />
      </FormSection>
    </div>
  )
}

type SelectFieldItem = { value: string; label: React.ReactNode }

/** Options of a `SelectField` from records with an `id` and a `label`. */
function toItems(records: { id: string; label: string }[]): SelectFieldItem[] {
  return records.map((record) => ({ value: record.id, label: record.label }))
}

/** Labelled, filled single `Select` inside a `Field`. */
function SelectField({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  items: SelectFieldItem[]
}) {
  const id = React.useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        id={id}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next)
        }}
        items={items}
      >
        <SelectTrigger variant="filled">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function FormSection({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  return (
    <Collapsible
      data-slot="facies-form-section"
      className="group/section flex flex-col gap-3"
      defaultOpen={defaultExpanded}
    >
      <Separator emphasis="subtle" />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <SlidersHorizontalIcon className="size-4" aria-hidden />
          <CollapsibleTrigger
            aria-label={`Toggle ${title}`}
            className="flex size-6 items-center justify-center rounded-sm outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronDownIcon
              className="size-4 transition-transform group-data-open/section:rotate-180"
              aria-hidden
            />
          </CollapsibleTrigger>
        </span>
      </div>
      <CollapsibleContent className="flex flex-col gap-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

function OptionCheckbox({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  const id = React.useId()
  return (
    <Field orientation="horizontal" data-slot="option-checkbox">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id} className="text-sm font-normal">
          {title}
        </FieldLabel>
        {description && (
          <FieldDescription className="text-xs">{description}</FieldDescription>
        )}
      </FieldContent>
    </Field>
  )
}

export { FaciesForm, FormSection, OptionCheckbox }
export type { FaciesFormProps }
