"use client"

import * as React from "react"
import { cn } from "cn"
import { InfoIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@tecton/react/components/alert"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"

/* ------------------------------------------------------------------------ */
/* CodeTabs — "Command" / "Manual" installation tabs. The chosen tab is       */
/* remembered across pages.                                                  */
/* ------------------------------------------------------------------------ */

const INSTALL_KEY = "tecton-docs:installation-type"

function readInstallType() {
  try {
    return window.localStorage.getItem(INSTALL_KEY) ?? "cli"
  } catch {
    return "cli"
  }
}

export function CodeTabs({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Tabs>, "children"> & {
  children: React.ReactNode
}) {
  const [value, setValue] = React.useState("cli")

  React.useEffect(() => {
    setValue(readInstallType())
  }, [])

  return (
    <Tabs
      data-not-typeset
      selectedKey={value}
      onSelectionChange={(key) => {
        const next = String(key)
        setValue(next)
        try {
          window.localStorage.setItem(INSTALL_KEY, next)
        } catch {
          // ignore
        }
      }}
      className={cn("relative mt-6 w-full gap-3", className)}
      {...props}
    >
      {children}
    </Tabs>
  )
}

/** shadcn docs use `value`; React Aria tabs use `id`. Accept both. */
export function DocsTabsTrigger({
  value,
  id,
  ...props
}: React.ComponentProps<typeof TabsTrigger> & { value?: string }) {
  return <TabsTrigger id={id ?? value} {...props} />
}

export function DocsTabsContent({
  value,
  id,
  className,
  ...props
}: React.ComponentProps<typeof TabsContent> & { value?: string }) {
  return (
    <TabsContent
      id={id ?? value}
      className={cn("[&>*:first-child]:mt-0 [&>figure:first-child]:mt-0", className)}
      {...props}
    />
  )
}

export function DocsTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return <TabsList variant="line" className={cn("gap-4 border-b px-0", className)} {...props} />
}

export function DocsTabs({
  className,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Tabs> & { defaultValue?: string }) {
  return (
    <Tabs
      data-not-typeset
      defaultSelectedKey={defaultValue}
      className={cn("relative mt-6 w-full gap-3", className)}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------------ */
/* Steps                                                                     */
/* ------------------------------------------------------------------------ */

export function Steps({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="steps"
      className={cn(
        "mt-6 mb-10 ml-3.5 border-l border-border-subtle pl-8 [counter-reset:step]",
        className
      )}
      {...props}
    />
  )
}

export function Step({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="step"
      className={cn(
        "relative mt-8 mb-4 scroll-m-20 text-base font-medium tracking-tight first:mt-0 [counter-increment:step]",
        "before:absolute before:-left-[3.05rem] before:flex before:size-8 before:items-center before:justify-center before:rounded-full before:border before:bg-card before:text-xs before:font-medium before:text-muted-foreground before:content-[counter(step)]",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------------ */
/* Callout                                                                   */
/* ------------------------------------------------------------------------ */

const calloutIcons = {
  default: LightbulbIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
}

export function Callout({
  title,
  children,
  icon,
  className,
  variant = "default",
  ...props
}: Omit<React.ComponentProps<typeof Alert>, "variant"> & {
  icon?: React.ReactNode
  variant?: "default" | "info" | "warning"
}) {
  const Icon = calloutIcons[variant]
  return (
    <Alert
      data-not-typeset
      data-variant={variant}
      className={cn(
        "mt-6 w-auto rounded-lg border-border-subtle bg-card",
        variant === "warning" && "border-warning/50 [&>svg]:text-warning",
        variant === "info" && "[&>svg]:text-info",
        className
      )}
      {...props}
    >
      {icon ?? <Icon />}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="text-card-foreground/80 [&_p]:my-0 [&_ul]:my-2 [&_ul]:list-disc">
        {children}
      </AlertDescription>
    </Alert>
  )
}
