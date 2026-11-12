"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { MinusIcon, MoveHorizontalIcon, PlusIcon } from "lucide-react"

import { useDirection, useLocale } from "@tecton/react/provider"

/**
 * Tecton NumberField — a numeric input with minus / plus buttons, min / max /
 * step, locale-aware formatting, a unit suffix and drag-to-scrub. Compose
 * `NumberFieldGroup` (a boxed input between minus and plus) or
 * `NumberFieldSlider` (a box that fills to the value and scrubs when dragged,
 * as in 3D tools).
 */

type ChangeDetails = NumberFieldPrimitive.Root.ChangeEventDetails
type CommitDetails = NumberFieldPrimitive.Root.CommitEventDetails

/**
 * Configuration and stable callbacks. It changes only when a prop does, never
 * with the value, so the parts that read it do not re-render while typing,
 * stepping or scrubbing.
 */
type NumberFieldContextValue = {
  /** Reads the current value without subscribing to it. */
  getValue: () => number | null
  setValue: (value: number | null, details: ChangeDetails) => void
  commit: (value: number | null, details: CommitDetails) => void
  min: number | undefined
  max: number | undefined
  step: number | "any"
  smallStep: number
  largeStep: number
  snapOnStep: boolean
  disabled: boolean
  readOnly: boolean
  setUnitId: (id: string | undefined) => void
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(
  null
)
/** The current value: only `NumberFieldSlider` (its fill) subscribes. */
const NumberFieldValueContext = React.createContext<number | null>(null)
/** The `NumberFieldUnit` id the input is described by. */
const NumberFieldUnitIdContext = React.createContext<string | undefined>(
  undefined
)

function findInput(root: Element | null | undefined) {
  return (
    root?.querySelector<HTMLInputElement>('[data-slot="number-field-input"]') ??
    null
  )
}

function useNumberField(part: string) {
  const context = React.useContext(NumberFieldContext)
  if (!context) {
    throw new Error(`${part} must be used within a NumberField`)
  }
  return context
}

/** Keeps the latest callback in a ref so a stable wrapper can call it. */
function useLatest<T>(value: T) {
  const ref = React.useRef(value)
  React.useInsertionEffect(() => {
    ref.current = value
  })
  return ref
}

type NumberFieldProps = NumberFieldPrimitive.Root.Props

function NumberField({
  className,
  locale,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step = 1,
  smallStep = 0.1,
  largeStep = 10,
  snapOnStep = false,
  disabled = false,
  readOnly = false,
  allowWheelScrub = true,
  ...props
}: NumberFieldProps) {
  const contextLocale = useLocale().locale
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    number | null
  >(defaultValue ?? null)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolledValue
  const valueRef = useLatest(value)
  const [unitId, setUnitId] = React.useState<string | undefined>()

  const onValueChangeRef = useLatest(onValueChange)
  const onValueCommittedRef = useLatest(onValueCommitted)

  const setValue = React.useCallback(
    (next: number | null, details: ChangeDetails) => {
      onValueChangeRef.current?.(next, details)
      if (details.isCanceled) return
      if (!isControlled) setUncontrolledValue(next)
    },
    [isControlled, onValueChangeRef]
  )
  const commit = React.useCallback(
    (next: number | null, details: CommitDetails) => {
      onValueCommittedRef.current?.(next, details)
    },
    [onValueCommittedRef]
  )

  const context = React.useMemo<NumberFieldContextValue>(
    () => ({
      getValue: () => valueRef.current,
      setValue,
      commit,
      min,
      max,
      step,
      smallStep,
      largeStep,
      snapOnStep,
      disabled,
      readOnly,
      setUnitId,
    }),
    [
      valueRef,
      setValue,
      commit,
      min,
      max,
      step,
      smallStep,
      largeStep,
      snapOnStep,
      disabled,
      readOnly,
    ]
  )

  return (
    <NumberFieldContext.Provider value={context}>
      <NumberFieldValueContext.Provider value={value}>
        <NumberFieldUnitIdContext.Provider value={unitId}>
          <NumberFieldPrimitive.Root
            data-slot="number-field"
            locale={locale ?? contextLocale}
            // The value lives here (not in the primitive) so `NumberFieldSlider`
            // can read it for its fill and set it while scrubbing.
            value={value}
            onValueChange={setValue}
            onValueCommitted={commit}
            min={min}
            max={max}
            step={step}
            smallStep={smallStep}
            largeStep={largeStep}
            snapOnStep={snapOnStep}
            disabled={disabled}
            readOnly={readOnly}
            allowWheelScrub={allowWheelScrub}
            className={cn("flex w-full min-w-0 flex-col gap-3", className)}
            {...props}
          />
        </NumberFieldUnitIdContext.Provider>
      </NumberFieldValueContext.Provider>
    </NumberFieldContext.Provider>
  )
}

const numberFieldGroupVariants = cva(
  "group/number-field relative flex h-8 w-full min-w-0 items-center overflow-hidden rounded-md border border-input transition-[color,box-shadow] outline-none hover:border-input-hover has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-destructive/20 has-[[data-slot=number-field-input]:focus-visible]:border-ring has-[[data-slot=number-field-input]:focus-visible]:ring-2 has-[[data-slot=number-field-input]:focus-visible]:ring-ring dark:has-[[aria-invalid=true]]:ring-destructive/40 data-disabled:pointer-events-none data-disabled:opacity-50",
  {
    variants: {
      variant: {
        outline: "bg-transparent",
        filled:
          "border-transparent bg-input-filled hover:border-transparent has-[[aria-invalid=true]]:bg-destructive/20 has-[[aria-invalid=true]]:ring-0 has-[[data-slot=number-field-input]:focus]:bg-input-filled-focus dark:has-[[aria-invalid=true]]:border-destructive",
        text: "rounded-none border-x-0 border-t-0 border-transparent bg-transparent hover:border-transparent has-[[aria-invalid=true]]:ring-0 has-[[data-slot=number-field-input]:focus-visible]:ring-0 data-disabled:border-border",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

type NumberFieldGroupProps = NumberFieldPrimitive.Group.Props &
  VariantProps<typeof numberFieldGroupVariants>

function NumberFieldGroup({
  className,
  variant = "outline",
  ...props
}: NumberFieldGroupProps) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      data-variant={variant}
      className={cn(numberFieldGroupVariants({ variant }), className)}
      {...props}
    />
  )
}

type NumberFieldInputProps = NumberFieldPrimitive.Input.Props

function NumberFieldInput({
  className,
  "aria-describedby": describedBy,
  ...props
}: NumberFieldInputProps) {
  useNumberField("NumberFieldInput")
  const unitId = React.useContext(NumberFieldUnitIdContext)
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      aria-describedby={
        [describedBy, unitId].filter(Boolean).join(" ") || undefined
      }
      className={cn(
        "h-full w-full min-w-0 flex-1 bg-transparent px-2 py-1 text-base tabular-nums outline-none group-has-[[data-slot=number-field-decrement]]/number-field:text-center placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
        className
      )}
      {...props}
    />
  )
}

type NumberFieldUnitProps = React.ComponentProps<"span">

/**
 * A unit after the value ("ft", "psi", "bbl/d"). It describes the input for
 * assistive tech. For units `Intl.NumberFormat` knows, prefer
 * `format={{ style: "unit", unit: "meter" }}` on `NumberField`.
 */
function NumberFieldUnit({
  className,
  id: idProp,
  onClick,
  ...props
}: NumberFieldUnitProps) {
  const { setUnitId } = useNumberField("NumberFieldUnit")
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  React.useEffect(() => {
    setUnitId(id)
    return () => setUnitId(undefined)
  }, [id, setUnitId])
  return (
    <span
      id={id}
      data-slot="number-field-unit"
      className={cn(
        "shrink-0 pe-2 text-sm text-muted-foreground select-none",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        findInput(event.currentTarget.parentElement)?.focus()
      }}
      {...props}
    />
  )
}

const stepperButtonClass =
  "flex aspect-square h-full shrink-0 touch-manipulation items-center justify-center text-ghost-foreground outline-none select-none hover:bg-ghost-hover hover:text-ghost-hover-foreground focus-visible:bg-ghost-hover focus-visible:text-ghost-hover-foreground active:bg-ghost-pressed active:text-ghost-pressed-foreground disabled:pointer-events-none disabled:opacity-50 pointer-coarse:aspect-auto pointer-coarse:w-11 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"

type NumberFieldIncrementProps = NumberFieldPrimitive.Increment.Props

/** The plus button. Place it after the input. */
function NumberFieldIncrement({
  className,
  children,
  ...props
}: NumberFieldIncrementProps) {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      className={cn(stepperButtonClass, className)}
      {...props}
    >
      {children ?? <PlusIcon />}
    </NumberFieldPrimitive.Increment>
  )
}

type NumberFieldDecrementProps = NumberFieldPrimitive.Decrement.Props

/** The minus button. Place it before the input. */
function NumberFieldDecrement({
  className,
  children,
  ...props
}: NumberFieldDecrementProps) {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      className={cn(stepperButtonClass, className)}
      {...props}
    >
      {children ?? <MinusIcon />}
    </NumberFieldPrimitive.Decrement>
  )
}

type NumberFieldScrubAreaProps = NumberFieldPrimitive.ScrubArea.Props

/** Wrap a label in it to change the value by dragging the label sideways. */
function NumberFieldScrubArea({
  className,
  children,
  ...props
}: NumberFieldScrubAreaProps) {
  return (
    <NumberFieldPrimitive.ScrubArea
      data-slot="number-field-scrub-area"
      className={cn(
        "inline-flex w-fit cursor-ew-resize items-center **:cursor-[inherit] data-readonly:cursor-default data-disabled:cursor-default",
        className
      )}
      {...props}
    >
      {children}
      <NumberFieldPrimitive.ScrubAreaCursor
        data-slot="number-field-scrub-area-cursor"
        className="drop-shadow-sm"
      >
        <MoveHorizontalIcon className="size-5" />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  )
}

/** Movement (px) before a press on the slider becomes a drag. */
const DRAG_THRESHOLD = 3
/** A fingertip wobbles more than a mouse: a tap must not nudge the value. */
const TOUCH_DRAG_THRESHOLD = 8

function decimalPlaces(n: number) {
  if (!Number.isFinite(n)) return 0
  const [mantissa, exponent = "0"] = String(n).toLowerCase().split("e")
  const decimals = (mantissa.split(".")[1] ?? "").length
  return Math.max(0, decimals - Number(exponent))
}

function roundTo(n: number, decimals: number) {
  const factor = 10 ** Math.min(decimals, 15)
  return Math.round(n * factor) / factor
}

function changeDetails(
  reason: "scrub" | "none",
  event: Event,
  trigger: HTMLElement | null,
  direction?: 1 | -1
): ChangeDetails {
  let canceled = false
  let propagation = false
  return {
    reason,
    event,
    trigger: trigger ?? undefined,
    direction,
    cancel() {
      canceled = true
    },
    allowPropagation() {
      propagation = true
    },
    get isCanceled() {
      return canceled
    },
    get isPropagationAllowed() {
      return propagation
    },
  } as ChangeDetails
}

type Drag = {
  element: HTMLElement
  pointerId: number
  threshold: number
  startX: number
  lastX: number
  startValue: number | null
  /** Unrounded value the pointer has travelled to. */
  raw: number
  emitted: number | null
  scrubbing: boolean
  /** The press started in the focused input, so it may be placing the caret. */
  editing: boolean
  rtl: boolean
  width: number
}

type NumberFieldSliderProps = NumberFieldPrimitive.Group.Props &
  VariantProps<typeof numberFieldGroupVariants> & {
    /**
     * Pixels of drag per `step` when the field has no `min` and `max`. With
     * both bounds, dragging across the whole box covers the whole range.
     * @default 2
     */
    pixelSensitivity?: number
  }

/**
 * A number field that fills to its value between `min` and `max` and changes
 * the value when dragged sideways (Shift: `largeStep`, Alt: `smallStep`).
 * A click without a drag edits the number as text; Escape cancels a drag.
 * On touch screens a sideways swipe scrubs and a vertical one still scrolls
 * the page.
 */
function NumberFieldSlider({
  className,
  variant = "outline",
  pixelSensitivity = 2,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: NumberFieldSliderProps) {
  const field = useNumberField("NumberFieldSlider")
  const direction = useDirection()
  const {
    min,
    max,
    step,
    smallStep,
    largeStep,
    snapOnStep,
    disabled,
    readOnly,
  } = field
  const dragRef = React.useRef<Drag | null>(null)
  const [scrubbing, setScrubbing] = React.useState(false)

  const bounded =
    min !== undefined &&
    max !== undefined &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    max > min

  const capture = (drag: Drag) => {
    try {
      drag.element.setPointerCapture(drag.pointerId)
    } catch {
      // Pointer capture is not available (e.g. synthetic events).
    }
  }

  const endDrag = React.useCallback(() => {
    const drag = dragRef.current
    dragRef.current = null
    setScrubbing(false)
    try {
      drag?.element.releasePointerCapture(drag.pointerId)
    } catch {
      // The capture was already released.
    }
  }, [])

  /** Ends the drag for this pointer and commits a scrub; returns the drag. */
  const finishDrag = (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return null
    endDrag()
    if (drag.scrubbing) {
      field.commit(drag.emitted, { reason: "scrub", event: event.nativeEvent })
    }
    return drag
  }

  const onEscape = React.useEffectEvent((event: KeyboardEvent) => {
    const drag = dragRef.current
    if (event.key !== "Escape" || !drag) return
    event.preventDefault()
    event.stopPropagation()
    if (drag.emitted !== drag.startValue) {
      field.setValue(
        drag.startValue,
        changeDetails("none", event, drag.element)
      )
    }
    endDrag()
  })

  React.useEffect(() => {
    const doc = dragRef.current?.element.ownerDocument
    if (!scrubbing || !doc) return undefined
    doc.addEventListener("keydown", onEscape, true)
    return () => doc.removeEventListener("keydown", onEscape, true)
  }, [scrubbing])

  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-slider"
      data-variant={variant}
      data-scrubbing={scrubbing ? "" : undefined}
      className={cn(
        numberFieldGroupVariants({ variant }),
        "isolate touch-pan-y overflow-hidden [-webkit-tap-highlight-color:transparent] not-has-[[data-slot=number-field-input]:focus]:cursor-ew-resize not-has-[[data-slot=number-field-input]:focus]:select-none not-has-[[data-slot=number-field-input]:focus]:[-webkit-touch-callout:none] data-readonly:cursor-default! not-has-[[data-slot=number-field-input]:focus]:[&_[data-slot=number-field-input]]:cursor-ew-resize data-readonly:[&_[data-slot=number-field-input]]:cursor-default!",
        className
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          // A second finger (or pen) while one drag is running.
          dragRef.current ||
          disabled ||
          readOnly
        ) {
          return
        }
        const element = event.currentTarget
        const target = event.target as HTMLElement
        if (target.closest("button")) return
        const input = findInput(element)
        const value = field.getValue()
        const drag: Drag = {
          element,
          pointerId: event.pointerId,
          threshold:
            event.pointerType === "touch"
              ? TOUCH_DRAG_THRESHOLD
              : DRAG_THRESHOLD,
          startX: event.clientX,
          lastX: event.clientX,
          startValue: value,
          raw:
            value ?? Math.min(Math.max(0, min ?? -Infinity), max ?? Infinity),
          emitted: value,
          scrubbing: false,
          // Already editing: let the press place the caret. It only becomes
          // a drag once the pointer travels past the threshold.
          editing:
            input !== null &&
            target === input &&
            input === input.ownerDocument.activeElement,
          rtl: direction === "rtl",
          width: element.getBoundingClientRect().width,
        }
        dragRef.current = drag
        if (!drag.editing) {
          // Keep focus and text selection out of the way until we know
          // whether this press is a click or a drag.
          event.preventDefault()
          capture(drag)
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        const drag = dragRef.current
        if (!drag || event.pointerId !== drag.pointerId) return
        if (!drag.scrubbing) {
          if (Math.abs(event.clientX - drag.startX) < drag.threshold) return
          drag.scrubbing = true
          drag.lastX = event.clientX
          if (drag.editing) {
            // Leave text editing: blurring commits the typed text and ends
            // the text selection the press started.
            capture(drag)
            findInput(drag.element)?.blur()
            drag.element.ownerDocument.getSelection()?.removeAllRanges()
          }
          setScrubbing(true)
          return
        }
        const dx = (event.clientX - drag.lastX) * (drag.rtl ? -1 : 1)
        drag.lastX = event.clientX
        if (dx === 0) return

        const unit = step === "any" ? 1 : step
        const multiplier = event.altKey
          ? smallStep / unit
          : event.shiftKey
            ? largeStep / unit
            : 1
        const perPixel =
          bounded && drag.width > 0
            ? (max - min) / drag.width
            : unit / Math.max(1, pixelSensitivity)
        const clamp = (n: number) =>
          Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
        drag.raw = clamp(drag.raw + dx * perPixel * multiplier)

        // Snap to the step grid from `min`, or (unbounded, without
        // `snapOnStep`) to steps from where the drag started.
        const quantum = event.altKey ? smallStep : step === "any" ? 0 : unit
        const origin =
          bounded || snapOnStep || drag.startValue === null
            ? (min ?? 0)
            : drag.startValue
        const snapped =
          quantum > 0
            ? origin + Math.round((drag.raw - origin) / quantum) * quantum
            : drag.raw
        const next = clamp(
          roundTo(
            snapped,
            Math.max(
              decimalPlaces(quantum),
              decimalPlaces(origin),
              decimalPlaces(drag.startValue ?? 0)
            )
          )
        )
        if (next === drag.emitted) return
        const towards = drag.emitted === null || next > drag.emitted ? 1 : -1
        drag.emitted = next
        field.setValue(
          next,
          changeDetails("scrub", event.nativeEvent, drag.element, towards)
        )
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        const drag = finishDrag(event)
        // A click in the focused input placed the caret; leave it there.
        if (!drag || drag.scrubbing || drag.editing) return
        const input = findInput(drag.element)
        input?.focus()
        input?.select()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        finishDrag(event)
      }}
      {...props}
    >
      {bounded && <NumberFieldSliderFill min={min} max={max} />}
      {children}
    </NumberFieldPrimitive.Group>
  )
}

/**
 * The only part that subscribes to the value, so a value change re-renders
 * this span and not the slider around it.
 */
const NumberFieldSliderFill = React.memo(function NumberFieldSliderFill({
  min,
  max,
}: {
  min: number
  max: number
}) {
  const value = React.useContext(NumberFieldValueContext)
  if (value === null) return null
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  )
  return (
    <span
      aria-hidden
      data-slot="number-field-slider-fill"
      className="pointer-events-none absolute inset-y-0 start-0 -z-10 bg-number-field-fill"
      style={{ width: `${percentage}%` }}
    />
  )
})

export {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldUnit,
  NumberFieldIncrement,
  NumberFieldDecrement,
  NumberFieldScrubArea,
  NumberFieldSlider,
  numberFieldGroupVariants,
}
export type {
  NumberFieldProps,
  NumberFieldGroupProps,
  NumberFieldInputProps,
  NumberFieldUnitProps,
  NumberFieldIncrementProps,
  NumberFieldDecrementProps,
  NumberFieldScrubAreaProps,
  NumberFieldSliderProps,
}
