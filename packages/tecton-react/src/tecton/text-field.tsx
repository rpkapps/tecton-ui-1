"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  composeRenderProps,
  FieldError as FieldErrorPrimitive,
  TextField as TextFieldPrimitive,
  Text as TextPrimitive,
  type FieldErrorProps,
  type TextFieldProps as TextFieldPrimitiveProps,
  type TextProps,
} from "react-aria-components"

import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import { Textarea } from "@tecton/react/components/textarea"

/**
 * Tecton TextField — label + input + helper/error text on React Aria
 * `TextField`, with Tecton's three visual variants:
 * `outlined` (shadcn default), `filled` (muted surface, bottom border) and
 * `textOnly` (underline only). Composes the shadcn `Input` / `Textarea`.
 */
const textFieldControlVariants = cva("", {
  variants: {
    variant: {
      outlined: "",
      filled:
        "rounded-b-none border-x-0 border-t-0 border-b-border bg-muted shadow-none focus-visible:border-ring focus-visible:ring-0 hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] aria-invalid:bg-destructive/20 aria-invalid:ring-0 dark:bg-muted dark:aria-invalid:border-destructive",
      textOnly:
        "rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-ring focus-visible:ring-0 hover:border-b-foreground/60 aria-invalid:ring-0 dark:bg-transparent",
    },
    size: {
      md: "",
      sm: "h-8 text-sm md:text-xs",
    },
  },
  defaultVariants: {
    variant: "outlined",
    size: "md",
  },
})

type TextFieldVariantProps = VariantProps<typeof textFieldControlVariants>

const TextFieldVariantContext = React.createContext<TextFieldVariantProps>({})

type TextFieldProps = Omit<TextFieldPrimitiveProps, "className" | "children"> &
  TextFieldVariantProps & {
    className?: string
    children?: React.ReactNode
    /** Convenience: renders a `TextFieldLabel`. */
    label?: React.ReactNode
    /** Convenience: renders a `TextFieldDescription`. */
    description?: React.ReactNode
    /** Convenience: renders a `TextFieldError` (also sets `isInvalid`). */
    errorMessage?: React.ReactNode
    placeholder?: string
    /** Render a multi-line `Textarea` instead of an `Input`. */
    multiline?: boolean
    rows?: number
  }

function TextField({
  className,
  variant = "outlined",
  size = "md",
  label,
  description,
  errorMessage,
  placeholder,
  multiline,
  rows,
  children,
  isInvalid,
  ...props
}: TextFieldProps) {
  const context = React.useMemo(() => ({ variant, size }), [variant, size])
  const hasError = Boolean(errorMessage)

  return (
    <TextFieldVariantContext value={context}>
      <TextFieldPrimitive
        data-slot="text-field"
        data-variant={variant}
        data-size={size}
        isInvalid={isInvalid ?? hasError}
        className={cn("group/text-field flex w-full flex-col gap-1.5", className)}
        {...props}
      >
        {label !== undefined && <TextFieldLabel>{label}</TextFieldLabel>}
        {children ??
          (multiline ? (
            <TextFieldTextarea placeholder={placeholder} rows={rows} />
          ) : (
            <TextFieldInput placeholder={placeholder} />
          ))}
        {description !== undefined && (
          <TextFieldDescription>{description}</TextFieldDescription>
        )}
        {hasError && <TextFieldError>{errorMessage}</TextFieldError>}
      </TextFieldPrimitive>
    </TextFieldVariantContext>
  )
}

function TextFieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="text-field-label"
      className={cn(
        "text-xs text-muted-foreground group-data-[invalid]/text-field:text-destructive group-data-[disabled]/text-field:opacity-50 group-has-[[data-slot=input]:focus-visible]/text-field:text-ring group-has-[[data-slot=textarea]:focus-visible]/text-field:text-ring",
        className
      )}
      {...props}
    />
  )
}

function TextFieldInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { variant, size } = React.useContext(TextFieldVariantContext)
  return (
    <Input
      data-slot="text-field-input"
      className={composeRenderProps(className, (className) =>
        cn(textFieldControlVariants({ variant, size }), className)
      )}
      {...props}
    />
  )
}

function TextFieldTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  const { variant, size } = React.useContext(TextFieldVariantContext)
  return (
    <Textarea
      data-slot="text-field-textarea"
      className={composeRenderProps(className, (className) =>
        cn(
          textFieldControlVariants({ variant, size }),
          size === "sm" && "h-auto min-h-14",
          className
        )
      )}
      {...props}
    />
  )
}

function TextFieldDescription({ className, ...props }: TextProps) {
  return (
    <TextPrimitive
      slot="description"
      data-slot="text-field-description"
      className={cn(
        "text-xs text-muted-foreground group-data-[disabled]/text-field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function TextFieldError({ className, ...props }: FieldErrorProps) {
  return (
    <FieldErrorPrimitive
      data-slot="text-field-error"
      className={composeRenderProps(className, (className) =>
        cn("text-xs text-destructive", className)
      )}
      {...props}
    />
  )
}

export {
  TextField,
  TextFieldLabel,
  TextFieldInput,
  TextFieldTextarea,
  TextFieldDescription,
  TextFieldError,
  textFieldControlVariants,
}
export type { TextFieldProps }
