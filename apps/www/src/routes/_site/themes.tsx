"use client"

import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useTheme } from "next-themes"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import { Switch } from "@tecton/react/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@tecton/react/components/toggle-group"
import { Chip } from "@tecton/react/tecton/chip"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"
import { CopyButton } from "@tecton/react/tecton/copy-button"
import { PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@tecton/react/tecton/page-header"
import { StatusAlert } from "@tecton/react/tecton/status-alert"

import { CodeBlock } from "@/components/code-block"
import { HeroPreview } from "@/components/hero-preview"
import { TokenTable } from "@/components/token-table"
import { siteConfig } from "@/lib/site"

import theme from "../../../../../packages/tecton-react/registry/theme.json"
import themeCss from "../../../../../packages/tecton-react/src/styles/tecton-theme.css?raw"

export const Route = createFileRoute("/_site/themes")({
  head: () => ({ meta: [{ title: `Themes – ${siteConfig.name}` }] }),
  component: ThemesPage,
})

const radii = [
  { label: "Tecton (4px)", value: "0.25rem" },
  { label: "0", value: "0rem" },
  { label: "0.5rem", value: "0.5rem" },
  { label: "0.625rem (shadcn)", value: "0.625rem" },
  { label: "1rem", value: "1rem" },
]

const swatches = [
  "background",
  "foreground",
  "card",
  "primary",
  "primary-foreground",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "destructive",
  "border",
  "ring",
  "success",
  "warning",
  "info",
  "neutral",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const

function ThemesPage() {
  const { theme: mode, resolvedTheme, setTheme } = useTheme()
  const [radius, setRadius] = React.useState("0.25rem")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    document.documentElement.style.setProperty("--radius", radius)
    return () => {
      document.documentElement.style.removeProperty("--radius")
    }
  }, [radius])

  const values = (resolvedTheme === "light" ? theme.cssVars.light : theme.cssVars.dark) as Record<
    string,
    string
  >

  return (
    <main className="container-wrapper flex flex-1 flex-col gap-10 px-6 py-8 md:py-10">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Themes</PageHeaderTitle>
          <PageHeaderDescription>
            The Tecton theme is a set of values for the shadcn CSS variables. Switch
            the mode, try a different radius scale and copy the generated CSS.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Mode</span>
            <ToggleGroup
              aria-label="Mode"
              selectionMode="single"
              selectedKeys={mounted && mode ? [mode] : []}
              disallowEmptySelection
              onSelectionChange={(keys) => setTheme(String([...keys][0]))}
            >
              <ToggleGroupItem id="dark">Dark</ToggleGroupItem>
              <ToggleGroupItem id="light">Light</ToggleGroupItem>
              <ToggleGroupItem id="system">System</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Radius (`--radius`)</span>
            <ToggleGroup
              aria-label="Radius"
              selectionMode="single"
              selectedKeys={[radius]}
              disallowEmptySelection
              onSelectionChange={(keys) => setRadius(String([...keys][0]))}
            >
              {radii.map((r) => (
                <ToggleGroupItem key={r.value} id={r.value}>
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              Tecton pins <code>--radius-sm</code>…<code>--radius-2xl</code> explicitly, so only utilities based on
              <code> --radius</code> follow this control.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
            {swatches.map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-md border bg-card p-2">
                <ColorSwatch color={values[name] ?? "transparent"} size="md" shape="rounded" />
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-xs font-medium">--{name}</span>
                  <span className="truncate font-mono text-[0.625rem] text-muted-foreground">
                    {values[name]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <StatusAlert
            severity="info"
            variant="outlined"
            title="Both modes are Tecton tokens"
            description="Every shadcn variable references a token from the Tecton CSS export in light and dark; the token file switches the value."
          />
        </div>
        <div className="flex flex-col gap-6">
          <HeroPreview />
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Chip color="primary">Chip</Chip>
            <Chip color="warning" variant="outlined">
              Warning
            </Chip>
            <Input placeholder="Input" aria-label="Input" className="w-40" />
            <div className="flex items-center gap-2">
              <Checkbox id="themes-checkbox" defaultSelected />
              <Label htmlFor="themes-checkbox">Checkbox</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="themes-switch" defaultSelected />
              <Label htmlFor="themes-switch">Switch</Label>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Theme CSS</h2>
          <CopyButton value={themeCss} size="sm">
            Copy CSS
          </CopyButton>
        </div>
        <Tabs defaultSelectedKey="css" className="gap-3">
          <TabsList variant="line" className="h-8">
            <TabsTrigger id="css">tecton-theme.css</TabsTrigger>
            <TabsTrigger id="json">registry item</TabsTrigger>
            <TabsTrigger id="table">mapping</TabsTrigger>
          </TabsList>
          <TabsContent id="css">
            <CodeBlock code={themeCss} lang="css" title="@tecton/react/styles/tecton-theme.css" className="[&_pre]:max-h-[32rem]" />
          </TabsContent>
          <TabsContent id="json">
            <CodeBlock
              code={JSON.stringify(theme, null, 2)}
              lang="json"
              title="r/theme.json"
              className="[&_pre]:max-h-[32rem]"
            />
          </TabsContent>
          <TabsContent id="table">
            <TokenTable compact />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
