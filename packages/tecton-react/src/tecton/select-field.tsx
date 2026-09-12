"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  FieldError as FieldErrorPrimitive,
  Text as TextPrimitive,
  composeRenderProps,
  type FieldErrorProps,
  type TextProps,
} from "react-aria-components"

import { Label } from "@tecton/react/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

/**
 * Tecton Select — label + trigger + helper/error text with the
 * outlined / filled / textOnly variants. Composes the shadcn `Select`
 * primitives; pass `SelectItem`s as children (or `items` + a render
 * function exactly like `Select`).
 */
const selectFieldTriggerVariants = cva("", {
  variants: {
    variant: {
      outlined: "",
      filled:
        "rounded-b-none border-x-0 border-t-0 border-b-border bg-muted shadow-none focus-visible:border-ring focus-visible:ring-0 hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] aria-invalid:bg-destructive/20 aria-invalid:ring-0 dark:bg-muted dark:hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)]",
      textOnly:
        "rounded-none border-x-0 border-t-0 border-b-border bg-transparent pl-0 shadow-none focus-visible:border-ring focus-visible:ring-0 hover:border-b-foreground/60 aria-invalid:ring-0 dark:bg-transparent dark:hover:bg-transparent",
    },
  },
  defaultVariants: {
    variant: "outlined",
  },
})

type SelectFieldProps<T extends object> = Omit<
  React.ComponentProps<typeof Select<T, "single">>,
  "children"
> &
  VariantProps<typeof selectFieldTriggerVariants> & {
    /** `SelectFieldItem`s, or a render function when `items` is provided. */
    children?: React.ReactNode | ((item: T) => React.ReactNode)
    label?: React.ReactNode
    description?: React.ReactNode
    errorMessage?: React.ReactNode
    placeholder?: string
    size?: "default" | "sm"
    /** Dynamic items; children must then be a render function. */
    items?: Iterable<T>
    /** Props forwarded to the popover content. */
    contentProps?: Omit<React.ComponentProps<typeof SelectContent>, "children">
  }

function SelectField<T extends object>({
  className,
  variant = "outlined",
  size = "default",
  label,
  description,
  errorMessage,
  placeholder,
  items,
  contentProps,
  children,
  isInvalid,
  ...props
}: SelectFieldProps<T>) {
  const hasError = Boolean(errorMessage)

  return (
    <Select<T, "single">
      data-slot="select-field"
      data-variant={variant}
      placeholder={placeholder}
      isInvalid={isInvalid ?? hasError}
      className={cn("group/select-field flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {label !== undefined && <SelectFieldLabel>{label}</SelectFieldLabel>}
      <SelectTrigger
        size={size}
        className={selectFieldTriggerVariants({ variant })}
      >
        <SelectValue />
      </SelectTrigger>
      {description !== undefined && (
        <SelectFieldDescription>{description}</SelectFieldDescription>
      )}
      {hasError && <SelectFieldError>{errorMessage}</SelectFieldError>}
      <SelectContent {...contentProps}>
        {items && typeof children === "function"
          ? Array.from(items).map((item) => children(item))
          : (children as React.ReactNode)}
      </SelectContent>
    </Select>
  )
}

function SelectFieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="select-field-label"
      className={cn(
        "text-xs text-muted-foreground group-data-[invalid]/select-field:text-destructive group-data-[disabled]/select-field:opacity-50 group-has-[[data-slot=select-trigger]:focus-visible]/select-field:text-ring",
        className
      )}
      {...props}
    />
  )
}

function SelectFieldDescription({ className, ...props }: TextProps) {
  return (
    <TextPrimitive
      slot="description"
      data-slot="select-field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectFieldError({ className, ...props }: FieldErrorProps) {
  return (
    <FieldErrorPrimitive
      data-slot="select-field-error"
      className={composeRenderProps(className, (className) =>
        cn("text-xs text-destructive", className)
      )}
      {...props}
    />
  )
}

export {
  SelectField,
  SelectFieldLabel,
  SelectFieldDescription,
  SelectFieldError,
  SelectItem as SelectFieldItem,
  selectFieldTriggerVariants,
}
export type { SelectFieldProps }
