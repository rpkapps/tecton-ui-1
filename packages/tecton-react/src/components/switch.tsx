"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "data-checked:border-primary-active data-checked:bg-primary-active data-unchecked:border-outline-foreground peer group/switch relative inline-flex shrink-0 items-center rounded-full border transition-all outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-[size=default]:h-4 data-[size=default]:w-[34px] data-[size=sm]:h-3 data-[size=sm]:w-[26px] dark:aria-invalid:ring-destructive/40 data-unchecked:bg-transparent data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-outline-foreground pointer-events-none ms-0.5 block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-2.5 group-data-[size=sm]/switch:size-1.5 data-checked:bg-primary-foreground group-data-[size=default]/switch:data-checked:translate-x-[18px] rtl:group-data-[size=default]/switch:data-checked:-translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-[14px] rtl:group-data-[size=sm]/switch:data-checked:-translate-x-[14px] group-data-[size=default]/switch:data-unchecked:translate-x-0 rtl:group-data-[size=default]/switch:data-unchecked:-translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 rtl:group-data-[size=sm]/switch:data-unchecked:-translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
