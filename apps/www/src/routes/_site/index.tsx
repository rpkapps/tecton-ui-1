import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  BlocksIcon,
  LayersIcon,
  PaletteIcon,
  ShapesIcon,
  TerminalIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { LinkButton } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import { CopyButton } from "@tecton/react/tecton/copy-button"

import { HeroPreview } from "@/components/hero-preview"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/")({
  component: Home,
})

const features = [
  {
    icon: ShapesIcon,
    title: "60+ components",
    description:
      "Buttons, fields, menus, tables, overlays and charts — accessible out of the box, with the keyboard and focus behaviour built in.",
    href: "/docs/components",
  },
  {
    icon: LayersIcon,
    title: "Tecton components",
    description:
      "Chips, tree views, meters, stats, panels and application scaffolding. Status colours, field variants and the FAB are variants of the components you already have.",
    href: "/docs/tecton",
  },
  {
    icon: PaletteIcon,
    title: "Tokens, not overrides",
    description:
      "Colours, radii and type come from the Tecton design tokens and reach every component through the theme. Nothing to configure, nothing to restyle.",
    href: "/docs/theming",
  },
  {
    icon: BlocksIcon,
    title: "Blocks",
    description:
      "Reusable application patterns: AI agent panel, modelling panels, comparison tables, KPI cards and full dashboard layouts.",
    href: "/blocks",
  },
]

function Home() {
  return (
    <div className="container-wrapper flex flex-1 flex-col px-6"><div className="container flex flex-1 flex-col gap-16 py-12 md:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="md">React 19 · Tailwind v4</Badge>
            <Badge size="md" variant="secondary" appearance="outline">
              Tecton design system
            </Badge>
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-balance md:text-5xl">
            The Tecton component library for React.
          </h1>
          <p className="max-w-prose text-base text-muted-foreground md:text-lg">
            {siteConfig.description} Add the package, import a component, and
            the design system comes with it — in dark and light.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/docs" size="lg">
              Get started <ArrowRightIcon data-icon="inline-end" />
            </LinkButton>
            <LinkButton href="/docs/components" size="lg" variant="outline">
              Browse components
            </LinkButton>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
            <TerminalIcon className="size-3.5" />
            <span>pnpm add {siteConfig.package}</span>
            <CopyButton value={`pnpm add ${siteConfig.package}`} size="icon-xs" />
          </div>
        </div>
        <HeroPreview />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader>
              <feature.icon className="mb-2 size-5 text-muted-foreground" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link to={feature.href} className="text-sm font-medium underline-offset-4 hover:underline">
                Explore <ArrowRightIcon className="ml-1 inline size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-medium">The theme is the design system.</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            The Tecton palette reaches every component through{" "}
            <code>--background</code>, <code>--primary</code>,{" "}
            <code>--ring</code> and friends — every pair contrast-checked in both
            modes. Try the scales on the theme page.
          </p>
        </div>
        <LinkButton href="/themes" variant="secondary" size="sm">
          Open the theme page
        </LinkButton>
      </section>
    </div></div>
  )
}
