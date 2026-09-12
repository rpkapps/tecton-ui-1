import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "data-[appearance=filled]:bg-neutral data-[appearance=filled]:text-neutral-foreground data-[appearance=outline]:border-border-strong bg-card text-card-foreground data-[appearance=outline]:bg-transparent",
        destructive:
          "bg-card text-destructive data-[appearance=filled]:bg-destructive data-[appearance=filled]:text-destructive-foreground data-[appearance=outline]:border-destructive data-[appearance=outline]:bg-transparent *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
        success:
          "text-success *:data-[slot=alert-description]:text-success/90 data-[appearance=filled]:bg-success data-[appearance=filled]:text-success-foreground data-[appearance=outline]:border-success bg-card data-[appearance=outline]:bg-transparent *:[svg]:text-current",
        warning:
          "text-warning *:data-[slot=alert-description]:text-warning/90 data-[appearance=filled]:bg-warning data-[appearance=filled]:text-warning-foreground data-[appearance=outline]:border-warning bg-card data-[appearance=outline]:bg-transparent *:[svg]:text-current",
        info: "text-info *:data-[slot=alert-description]:text-info/90 data-[appearance=filled]:bg-info data-[appearance=filled]:text-info-foreground data-[appearance=outline]:border-info bg-card data-[appearance=outline]:bg-transparent *:[svg]:text-current",
      },
      appearance: {
        default: "border-border",
        outline: "*:data-[slot=alert-description]:text-current/85",
        filled:
          "border-transparent *:data-[slot=alert-description]:text-current/85",
      },
    },
    defaultVariants: {
      variant: "default",
      appearance: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  appearance = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-appearance={appearance}
      role="alert"
      className={cn(alertVariants({ variant, appearance }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "absolute top-2.5 right-3 flex items-center gap-1 *:data-[slot=button]:h-7 *:data-[slot=button]:text-current *:data-[slot=button]:hover:bg-current/10",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }
