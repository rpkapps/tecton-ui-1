"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { MinusIcon, PlusIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/button"
import { useLocale } from "@tecton/react/provider"

import { useTranslations } from "./internal/i18n/translations"

/**
 * Tecton NumberInput — a text field for a number, with a decrease and an
 * increase button at its end. It looks like `Input` (the same height,
 * border, radius, focus ring, invalid and disabled states and `variant`
 * surfaces) and its steppers are `InputGroup`'s ghost icon buttons, so it
 * sits beside `Input`, `InputGroup` and `SelectTrigger` in a form.
 *
 * The value is a number, or `null` while the field is empty. The arrow keys
 * step by `step`, with Shift by `largeStep`; Home and End go to `min` and
 * `max` when they are set. What is typed is parsed and shown in the
 * `TectonProvider`'s locale, formatted with `format` (units, currency,
 * percent, fraction digits) when the field loses focus. A value outside
 * `min` / `max` is clamped as it is typed unless `allowOutOfRange` is set,
 * which leaves typed values as they are (the steppers and keys still clamp)
 * for the form to report.
 *
 * `id`, `placeholder`, `aria-*`, the focus and key handlers and `ref` go to
 * the text field, so `FieldLabel htmlFor` names it and `aria-invalid` marks
 * it; `className` goes to the outer element (width, flex). `size="sm"` is
 * the height of a small `SelectTrigger`; `steppers={false}` leaves the
 * buttons out (the keys still step).
 */
const numberInputVariants = cva(
  "relative flex w-full min-w-0 items-center rounded-md border border-input bg-transparent transition-[color,box-shadow] outline-none hover:border-input-hover has-[[data-slot=number-input-input]:focus-visible]:border-ring has-[[data-slot=number-input-input]:focus-visible]:ring-2 has-[[data-slot=number-input-input]:focus-visible]:ring-ring has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-2 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:border-destructive/50 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
  {
    variants: {
      variant: {
        outline: "bg-transparent",
        filled:
          "rounded-b-none border-x-0 border-t-0 border-b-border bg-muted hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] has-[[data-slot][aria-invalid=true]]:bg-destructive/20 has-[[data-slot][aria-invalid=true]]:ring-0 dark:bg-muted dark:hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] dark:has-[[data-slot][aria-invalid=true]]:border-destructive",
        text: "rounded-none border-x-0 border-t-0 border-b-border bg-transparent hover:border-b-foreground/60 has-[[data-slot][aria-invalid=true]]:ring-0 dark:bg-transparent",
      },
      size: {
        /** `Input`'s height. */
        default: "h-8",
        /** The height of `SelectTrigger size="sm"` and `Button size="sm"`. */
        sm: "h-7",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

type NumberInputChangeEventDetails =
  NumberFieldPrimitive.Root.ChangeEventDetails
type NumberInputChangeEventReason = NumberFieldPrimitive.Root.ChangeEventReason

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  | "value"
  | "defaultValue"
  | "onChange"
  | "type"
  | "min"
  | "max"
  | "step"
  | "size"
  | "children"
  | "inputMode"
  | "form"
> &
  VariantProps<typeof numberInputVariants> & {
    /** The value: a number, or `null` while the field is empty. */
    value?: number | null
    /** The value the field starts with, uncontrolled. */
    defaultValue?: number | null
    /**
     * Called with each new value (`null` when the field is emptied):
     * `eventDetails.reason` is `"input-change"`, `"input-clear"`,
     * `"input-blur"`, `"input-paste"`, `"keyboard"`, `"increment-press"` or
     * `"decrement-press"`.
     */
    onValueChange?: (
      value: number | null,
      eventDetails: NumberInputChangeEventDetails
    ) => void
    min?: number
    max?: number
    /** The amount the arrow keys and the steppers change the value by. @default 1 */
    step?: number
    /** The amount with Shift held. @default 10 */
    largeStep?: number
    /** How the value is shown and parsed, in the provider's locale. */
    format?: Intl.NumberFormatOptions
    /**
     * Typed values outside `min` / `max` are kept, not clamped, so the form
     * can report them; stepping still clamps. @default false
     */
    allowOutOfRange?: boolean
    /**
     * The decrease and increase buttons. Off, the value is typed and stepped
     * with the keys only, for a narrow field in a toolbar. @default true
     */
    steppers?: boolean
  }

function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  largeStep,
  format,
  allowOutOfRange,
  disabled,
  readOnly,
  required,
  name,
  id,
  variant = "outline",
  size = "default",
  steppers = true,
  className,
  ...props
}: NumberInputProps) {
  const t = useTranslations("numberInput")
  const { locale } = useLocale()
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-input"
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      allowOutOfRange={allowOutOfRange}
      locale={locale}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      id={id}
      className={cn("w-full min-w-0", className)}
    >
      <NumberFieldPrimitive.Group
        data-slot="number-input-group"
        data-variant={variant}
        data-size={size}
        className={cn(
          "group/number-input",
          numberInputVariants({ variant, size })
        )}
      >
        <NumberFieldPrimitive.Input
          data-slot="number-input-input"
          className={cn(
            "h-full w-full min-w-0 flex-1 bg-transparent py-1 ps-2 pe-1.5 text-base tabular-nums outline-none group-data-[variant=text]/number-input:ps-0 placeholder:text-muted-foreground autofill:[-webkit-background-clip:text] autofill:[-webkit-text-fill-color:var(--foreground)] autofill:[transition:background-color_0s_600000s,color_0s_600000s] disabled:cursor-not-allowed md:text-sm",
            !steppers && "pe-2 group-data-[variant=text]/number-input:pe-0"
          )}
          {...props}
        />
        {steppers && (
          <div
            data-slot="number-input-steppers"
            className="flex shrink-0 items-center gap-0.5 pe-1 group-data-[variant=text]/number-input:pe-0"
          >
            <NumberFieldPrimitive.Decrement
              data-slot="number-input-decrement"
              aria-label={t("decrease")}
              className={stepperClassName}
            >
              <MinusIcon aria-hidden />
            </NumberFieldPrimitive.Decrement>
            <NumberFieldPrimitive.Increment
              data-slot="number-input-increment"
              aria-label={t("increase")}
              className={stepperClassName}
            >
              <PlusIcon aria-hidden />
            </NumberFieldPrimitive.Increment>
          </div>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

/**
 * `InputGroupButton`'s `size="icon-xs"` ghost button. At a bound (the
 * value at `max` for the increase button) or read-only it is disabled; in
 * a disabled field the whole field is dimmed once, not the buttons again.
 */
const stepperClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon-xs" }),
  "rounded-sm p-0 group-data-disabled/number-input:opacity-100 data-readonly:hidden data-disabled:pointer-events-none data-disabled:opacity-50"
)

export { NumberInput, numberInputVariants }
export type {
  NumberInputProps,
  NumberInputChangeEventDetails,
  NumberInputChangeEventReason,
}
