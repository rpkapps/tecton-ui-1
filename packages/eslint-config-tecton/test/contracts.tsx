/**
 * The per-component contracts on `shadcn/no-restyle`: the classes each
 * component's usage guideline (packages/tecton-react/guidelines/*.md)
 * documents that the base rule would otherwise reject, and the classes a
 * contract still must not let through.
 *
 * Same contract as fixture.tsx: every reported line carries an
 * `// expect:` comment naming the rule; every other line must come back
 * clean.
 */
import { Accordion } from "@tecton/react/components/accordion"
import { AspectRatio } from "@tecton/react/components/aspect-ratio"
import { AvatarBadge } from "@tecton/react/components/avatar"
import { Button, LinkButton } from "@tecton/react/components/button"
import { Card, CardFooter, CardHeader } from "@tecton/react/components/card"
import { Carousel, CarouselContent } from "@tecton/react/components/carousel"
import { ChartContainer } from "@tecton/react/components/chart"
import { Empty } from "@tecton/react/components/empty"
import { FieldGroup } from "@tecton/react/components/field"
import { MarkerContent } from "@tecton/react/components/marker"
import { ResizablePanelGroup } from "@tecton/react/components/resizable"
import { ScrollArea } from "@tecton/react/components/scroll-area"
import { Skeleton } from "@tecton/react/components/skeleton"
import { Slider } from "@tecton/react/components/slider"
import { Spinner } from "@tecton/react/components/spinner"
import { TableCell, TableHead } from "@tecton/react/components/table"
import {
  AppShell,
  AppShellAside,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"
import { Canvas } from "@tecton/react/tecton/canvas"
import { Panel } from "@tecton/react/tecton/panel"
import { ThemeRoot } from "@tecton/react/tecton/theme-root"

export function Allowed() {
  return (
    <>
      {/* guidelines/scroll-area.md, guidelines/resizable.md: a viewport with no height or frame of its own. */}
      <ScrollArea className="h-72 w-48 rounded-md border" />
      <ResizablePanelGroup className="h-96 rounded-lg border" />

      {/* Height from outside, everything else owned. */}
      <ChartContainer className="h-64 w-full" />
      <CarouselContent className="h-80" />
      <Canvas className="h-full" />
      <Panel className="h-72" />
      <Slider className="h-40" />
      <AppShell className="h-full" />

      {/* guidelines/app-shell.md */}
      <AppShellAside className="h-full w-full border-l-0" />
      <AppShellMain className="p-6" />

      {/* guidelines/empty.md, guidelines/skeleton.md: sizing IS the API. */}
      <Empty className="min-h-64 w-full border" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="size-12 rounded-full" />

      {/* guidelines/accordion.md */}
      <Accordion className="max-w-lg border" />

      {/* guidelines/aspect-ratio.md */}
      <AspectRatio className="w-full max-w-sm rounded-lg bg-muted" />

      {/* guidelines/spinner.md: size and a text colour token, real Tecton steps included. */}
      <Spinner className="size-5 text-muted-foreground" />
      <Spinner className="text-blue-830" />

      {/* guidelines/avatar.md: real Tecton steps, not the stock ones. */}
      <AvatarBadge className="bg-green-560" />
      <AvatarBadge className="bg-green-100" />

      {/* guidelines/table.md */}
      <TableCell className="text-right font-medium" />
      <TableCell className="truncate tabular-nums" />
      <TableHead className="w-24 font-semibold" />

      {/* guidelines/card.md: the divider the source already prices into its padding. */}
      <CardHeader className="border-b" />
      <CardFooter className="border-t" />

      {/* guidelines/field.md */}
      <FieldGroup className="flex-1 px-4" />

      {/* guidelines/theme-root.md: the scoping hook and a retint, mirrored onto the overlay container. */}
      <ThemeRoot className="mfe-a [--primary:var(--tecton-palette-green-560)]" />
      <ThemeRoot className="h-full p-4" />

      {/* guidelines/button.md: the FAB recipe. */}
      <Button className="rounded-full shadow-md" />
      <Button className="shadow-none" />
      <LinkButton className="rounded-full" />

      {/* guidelines/marker.md */}
      <MarkerContent className="shimmer" />
    </>
  )
}

export function Denied() {
  return (
    <>
      {/* ScrollArea has no padding of its own, and no colour. */}
      <ScrollArea className="p-4" /> {/* expect: shadcn/no-restyle */}
      <ScrollArea className="bg-muted" /> {/* expect: shadcn/no-restyle */}
      {/* ChartContainer, Panel: height is the only thing let through. */}
      <Panel className="rounded-none" /> {/* expect: shadcn/no-restyle */}
      {/* Carousel itself has no contract — only CarouselContent does. */}
      <Carousel className="h-80" /> {/* expect: shadcn/no-restyle */}
      {/* guidelines/app-shell.md: the aside's own left border would double the split handle. */}
      <AppShellAside className="border-l-2" /> {/* expect: shadcn/no-restyle */}
      {/* AppShellMain's height is the shell's. */}
      <AppShellMain className="h-96" /> {/* expect: shadcn/no-restyle */}
      {/* Skeleton's colour stays the component's. */}
      <Skeleton className="bg-gray-200" /> {/* expect: shadcn/no-restyle */}
      {/* AspectRatio allows the exact bg-muted class, not colour generally. */}
      <AspectRatio className="bg-red-500" /> {/* expect: shadcn/no-restyle */}
      <AspectRatio className="bg-accent" /> {/* expect: shadcn/no-restyle */}
      {/* Spinner: stock steps and families are denied by name. */}
      <Spinner className="text-gray-500" /> {/* expect: shadcn/no-restyle */}
      <Spinner className="text-zinc-100" /> {/* expect: shadcn/no-restyle */}
      <Spinner className="text-lg" /> {/* expect: shadcn/no-restyle */}
      {/* AvatarBadge: same stock denial, and colour is the only thing let through. */}
      <AvatarBadge className="bg-green-500" /> {/* expect: shadcn/no-restyle */}
      <AvatarBadge className="rounded-none" /> {/* expect: shadcn/no-restyle */}
      {/* TableCell: size and colour stay the table's. */}
      <TableCell className="text-xs" /> {/* expect: shadcn/no-restyle */}
      {/* CardHeader/CardFooter only allow the exact divider class. */}
      <CardHeader className="border-b-2" /> {/* expect: shadcn/no-restyle */}
      <CardHeader className="border-t" /> {/* expect: shadcn/no-restyle */}
      {/* Card itself has no contract. */}
      <Card className="border-t" /> {/* expect: shadcn/no-restyle */}
      {/* FieldGroup: padding is allowed, height is not. */}
      <FieldGroup className="h-40" /> {/* expect: shadcn/no-restyle */}
      {/* Button: shape and shadow only — heights stay denied by design. */}
      <Button className="bg-blue-600" /> {/* expect: shadcn/no-restyle */}
      {/* MarkerContent only allows the exact shimmer class. */}
      <MarkerContent className="text-lg" /> {/* expect: shadcn/no-restyle */}
    </>
  )
}

// These three combine a long component or class name with a long rule name,
// which prettier would otherwise break across two lines and separate from
// its `// expect:` comment — a trailing line comment after a lone returned
// element is the one form prettier never reflows.

export function ChartContainerShapeDenied() {
  return <ChartContainer className="rounded-lg" /> // expect: shadcn/no-restyle
}

export function AvatarBadgeStockFamilyDenied() {
  return <AvatarBadge className="bg-emerald-100" /> // expect: shadcn/no-restyle
}

export function ButtonHeightWithShapeDenied() {
  return <Button className="h-10 rounded-full shadow-md" /> // expect: shadcn/no-restyle
}
