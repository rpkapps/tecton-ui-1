"use client"

import { cn } from "cn"
import {
  composeRenderProps,
  Switch as SwitchPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "react-aria-components"

function Switch({
  className,
  size = "default",
  children,
  ...props
}: SwitchPrimitiveProps & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive
      data-slot="switch"
      data-size={size}
      className={cn(
        "data-checked:border-primary-active data-checked:bg-primary-active data-unchecked:border-outline-foreground data-selected:border-primary-active data-selected:bg-primary-active not-data-selected:border-outline-foreground peer group/switch relative inline-flex shrink-0 items-center rounded-full border transition-all outline-none not-data-selected:bg-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-focus-visible:border-ring data-focus-visible:ring-2 data-focus-visible:ring-ring data-invalid:border-destructive data-invalid:ring-2 data-invalid:ring-destructive/20 data-[size=default]:h-4 data-[size=default]:w-[34px] data-[size=sm]:h-3 data-[size=sm]:w-[26px] dark:aria-invalid:ring-destructive/40 dark:data-invalid:ring-destructive/40 data-unchecked:bg-transparent data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <>
          <span
            data-slot="switch-thumb"
            data-selected={isSelected || undefined}
            className="bg-outline-foreground not-data-selected:bg-outline-foreground pointer-events-none ml-0.5 block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-2.5 group-data-[size=default]/switch:not-data-selected:translate-x-0 group-data-[size=sm]/switch:size-1.5 group-data-[size=sm]/switch:not-data-selected:translate-x-0 data-checked:bg-primary-foreground group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-[14px] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 data-selected:bg-primary-foreground group-data-[size=default]/switch:data-selected:translate-x-[18px] group-data-[size=sm]/switch:data-selected:translate-x-[14px]"
          />
          {children}
        </>
      ))}
    </SwitchPrimitive>
  )
}

export { Switch }
