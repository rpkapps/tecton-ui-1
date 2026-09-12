"use client"

import { cn } from "cn"
import {
  composeRenderProps,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
  type RadioGroupProps,
  type RadioProps,
} from "react-aria-components"

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, children, ...props }: RadioProps) {
  return (
    <RadioPrimitive
      data-slot="radio-group-item"
      className={cn(
        "border-link-foreground text-link-foreground hover:border-link-hover-foreground data-checked:border-link-active-foreground data-checked:text-link-active-foreground group-has-[:focus-visible]/field-label:not-data-checked:border-link-foreground group-has-[:focus-visible]/field-label:data-checked:border-link-active-foreground data-hovered:border-link-hover-foreground data-selected:border-link-active-foreground data-selected:text-link-active-foreground group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border transition-[color,box-shadow] outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-destructive data-focus-visible:border-ring data-focus-visible:ring-2 data-focus-visible:ring-ring data-invalid:border-destructive data-invalid:ring-2 data-invalid:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:aria-invalid:ring-destructive/40 dark:data-invalid:ring-destructive/40 data-invalid:data-selected:border-destructive",
        className
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <>
          <span
            data-slot="radio-group-indicator"
            className="flex size-4 items-center justify-center"
          >
            {isSelected && (
              <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
            )}
          </span>
          {children}
        </>
      ))}
    </RadioPrimitive>
  )
}

export { RadioGroup, RadioGroupItem }
