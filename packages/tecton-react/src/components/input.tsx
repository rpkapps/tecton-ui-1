import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const inputVariants = cva(
  "hover:border-input-hover h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground autofill:[-webkit-background-clip:text] autofill:[-webkit-text-fill-color:var(--foreground)] autofill:[transition:background-color_0s_600000s,color_0s_600000s] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        outline: "bg-transparent",
        filled:
          "bg-input-filled focus:bg-input-filled-focus border-transparent autofill:shadow-[inset_0_0_0_1000px_var(--input-filled)] autofill:[-webkit-background-clip:border-box] hover:border-transparent focus-visible:border-ring focus-visible:ring-2 aria-invalid:bg-destructive/20 aria-invalid:ring-0 dark:aria-invalid:border-destructive",
        text: "rounded-none border-x-0 border-t-0 border-transparent bg-transparent px-0 hover:border-transparent focus-visible:ring-0 disabled:border-border aria-invalid:ring-0 dark:bg-transparent dark:hover:bg-transparent data-disabled:border-border",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

function Input({
  className,
  type,
  variant = "outline",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
