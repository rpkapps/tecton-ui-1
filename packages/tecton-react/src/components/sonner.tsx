import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--success-surface)",
          "--success-text": "var(--success-surface-foreground)",
          "--success-border": "var(--success-surface)",
          "--info-bg": "var(--info-surface)",
          "--info-text": "var(--info-surface-foreground)",
          "--info-border": "var(--info-surface)",
          "--warning-bg": "var(--warning-surface)",
          "--warning-text": "var(--warning-surface-foreground)",
          "--warning-border": "var(--warning-surface)",
          "--error-bg": "var(--destructive-surface)",
          "--error-text": "var(--destructive-surface-foreground)",
          "--error-border": "var(--destructive-surface)",
        } as React.CSSProperties
      }
      richColors
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
