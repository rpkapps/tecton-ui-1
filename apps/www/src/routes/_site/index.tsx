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
import { Button } from "@tecton/react/components/button"
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
    title: "60 shadcn components",
    description:
      "Every shadcn/ui component, generated with the shadcn CLI and shipped in one package. Same names, props, variants and composition.",
    href: "/docs/components",
  },
  {
    icon: LayersIcon,
    title: "Tecton components",
    description:
      "Chips, tree views, meters, stats, panels and application scaffolding that Tecton needs beyond shadcn. Status colours, field variants and the FAB are built into the shadcn components.",
    href: "/docs/tecton",
  },
  {
    icon: PaletteIcon,
    title: "Tokens, not overrides",
    description:
      "Tecton's colours, radii and type are applied only through the shadcn CSS variables. No generated file is hand-edited, so updates stay a CLI command away.",
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
    <div className="container-wrapper flex flex-1 flex-col px-6">
      <div className="container flex flex-1 flex-col gap-16 py-12 md:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="md">shadcn/ui · Tecton</Badge>
              <Badge size="md" variant="secondary" appearance="outline">
                Tecton design system
              </Badge>
            </div>
            <h1 className="text-4xl font-medium tracking-tight text-balance md:text-5xl">
              The Tecton component library, built on shadcn.
            </h1>
            <p className="max-w-prose text-base text-muted-foreground md:text-lg">
              {siteConfig.description} Consumers see only Tecton branding and
              imports — everything underneath stays upgradeable with the shadcn
              CLI.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link to="/docs" />}
              >
                Get started <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link to="/docs/$" params={{ _splat: "components" }} />}
              >
                Browse components
              </Button>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
              <TerminalIcon className="size-3.5" />
              <span>pnpm add {siteConfig.package}</span>
              <CopyButton
                value={`pnpm add ${siteConfig.package}`}
                size="icon-xs"
              />
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
                <Link
                  to={feature.href}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Explore <ArrowRightIcon className="ml-1 inline size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium">
              Only the shadcn CSS variables change.
            </h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              The Tecton palette is mapped to <code>--background</code>,{" "}
              <code>--primary</code>, <code>--ring</code> and friends. The
              mapping, its confidence and the contrast checks are documented and
              verified by <code>pnpm tokens:check</code>.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link to="/themes" />}
          >
            Open the theme page
          </Button>
        </section>
      </div>
    </div>
  )
}
