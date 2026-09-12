"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"

/**
 * Tecton Alert — severity (error / warning / info / success) × variant
 * (filled / outlined), with optional action and dismiss button.
 * Composes the shadcn `Alert` primitives.
 */
const statusAlertVariants = cva(
  "has-data-[slot=status-alert-toolbar]:pr-4 has-data-[slot=status-alert-toolbar]:grid-cols-[auto_1fr_auto] *:[svg]:translate-y-0",
  {
    variants: {
      severity: {
        error: "",
        warning: "",
        info: "",
        success: "",
      },
      variant: {
        filled: "border-transparent",
        outlined:
          "bg-transparent *:data-[slot=alert-description]:text-current/85",
      },
    },
    compoundVariants: [
      {
        severity: "error",
        variant: "filled",
        className:
          "bg-destructive text-destructive-foreground *:data-[slot=alert-description]:text-destructive-foreground/85",
      },
      {
        severity: "warning",
        variant: "filled",
        className:
          "bg-warning text-warning-foreground *:data-[slot=alert-description]:text-warning-foreground/85",
      },
      {
        severity: "info",
        variant: "filled",
        className:
          "bg-info text-info-foreground *:data-[slot=alert-description]:text-info-foreground/85",
      },
      {
        severity: "success",
        variant: "filled",
        className:
          "bg-success text-success-foreground *:data-[slot=alert-description]:text-success-foreground/85",
      },
      {
        severity: "error",
        variant: "outlined",
        className: "border-destructive text-destructive",
      },
      {
        severity: "warning",
        variant: "outlined",
        className: "border-warning text-warning",
      },
      { severity: "info", variant: "outlined", className: "border-info text-info" },
      {
        severity: "success",
        variant: "outlined",
        className: "border-success text-success",
      },
    ],
    defaultVariants: {
      severity: "info",
      variant: "filled",
    },
  }
)

const severityIcons = {
  error: CircleAlertIcon,
  warning: TriangleAlertIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
} as const

type StatusAlertProps = Omit<React.ComponentProps<typeof Alert>, "variant"> &
  VariantProps<typeof statusAlertVariants> & {
    title?: React.ReactNode
    description?: React.ReactNode
    /** Custom leading icon; `false` hides the icon. */
    icon?: React.ReactNode | false
    /** Rendered in the trailing toolbar (e.g. a ghost `Button`). */
    action?: React.ReactNode
    /** When provided, a dismiss button is rendered. */
    onDismiss?: () => void
    dismissLabel?: string
  }

function StatusAlert({
  className,
  severity = "info",
  variant = "filled",
  title,
  description,
  icon,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
  ...props
}: StatusAlertProps) {
  const Icon = severityIcons[severity ?? "info"]
  const showToolbar = action !== undefined || onDismiss !== undefined

  return (
    <Alert
      data-slot="status-alert"
      data-severity={severity}
      data-variant={variant}
      className={cn(statusAlertVariants({ severity, variant }), className)}
      {...props}
    >
      {icon === false ? null : (icon ?? <Icon />)}
      {title !== undefined && <AlertTitle>{title}</AlertTitle>}
      {description !== undefined && (
        <AlertDescription>{description}</AlertDescription>
      )}
      {children}
      {showToolbar && (
        <AlertAction
          data-slot="status-alert-toolbar"
          className="static col-start-3 row-span-2 row-start-1 flex items-center gap-1 self-start [&_[data-slot=button]]:h-7 [&_[data-slot=button]]:text-current [&_[data-slot=button]]:hover:bg-current/10"
        >
          {action}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={dismissLabel}
              onPress={onDismiss}
            >
              <XIcon />
            </Button>
          )}
        </AlertAction>
      )}
    </Alert>
  )
}

export { StatusAlert, statusAlertVariants }
export type { StatusAlertProps }
