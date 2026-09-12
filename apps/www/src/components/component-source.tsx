"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

import { CodeBlock } from "@/components/code-block"
import { loadExampleSource } from "@/lib/examples"
import { hasSource, loadSource, sourceTitle } from "@/lib/sources"

const cache = new Map<string, Promise<string>>()

function resolve(name: string | undefined, src: string | undefined) {
  const key = src ? `src:${src}` : `name:${name}`
  let promise = cache.get(key)
  if (!promise) {
    if (src) {
      promise = loadSource(src)
    } else if (name && hasSource(`components/${name}`)) {
      promise = loadSource(`components/${name}`)
    } else if (name && hasSource(`tecton/${name}`)) {
      promise = loadSource(`tecton/${name}`)
    } else if (name) {
      promise = loadExampleSource(name)
    } else {
      promise = Promise.resolve("")
    }
    cache.set(key, promise.catch(() => ""))
    promise = cache.get(key)!
  }
  return promise
}

function Inner({
  name,
  src,
  title,
  language,
  maxLines,
  className,
}: {
  name?: string
  src?: string
  title?: string
  language?: string
  maxLines?: number
  className?: string
}) {
  const code = React.use(resolve(name, src))
  if (!code) {
    return (
      <p className="my-4 text-sm text-muted-foreground">
        Source <code>{src ?? name}</code> is not available in this build.
      </p>
    )
  }
  const resolvedTitle =
    title ??
    (src
      ? sourceTitle(src)
      : name && hasSource(`components/${name}`)
        ? sourceTitle(`components/${name}`)
        : name && hasSource(`tecton/${name}`)
          ? sourceTitle(`tecton/${name}`)
          : undefined)
  const lang = language ?? resolvedTitle?.split(".").pop() ?? "tsx"
  return (
    <CodeBlock
      code={code}
      lang={lang === "css" ? "css" : lang === "ts" ? "ts" : lang}
      title={resolvedTitle}
      maxLines={maxLines}
      className={className}
    />
  )
}

/**
 * Renders the source of a library file (`name="button"` → components/button,
 * `name="chip"` → tecton/chip, `src="hooks/use-mobile"`) or of an example.
 * Collapsible (like the shadcn docs) unless `collapsible={false}`.
 */
export function ComponentSource({
  name,
  src,
  title,
  language,
  collapsible = true,
  maxLines,
  className,
}: {
  name?: string
  src?: string
  title?: string
  language?: string
  collapsible?: boolean
  maxLines?: number
  className?: string
}) {
  const [expanded, setExpanded] = React.useState(false)

  if (!name && !src) return null

  const content = (
    <React.Suspense fallback={<div className="code-figure my-0 h-24 animate-pulse" />}>
      <Inner
        name={name}
        src={src}
        title={title}
        language={language}
        maxLines={maxLines}
        className={className}
      />
    </React.Suspense>
  )

  if (!collapsible) return content

  return (
    <div
      data-not-typeset
      data-expanded={expanded}
      className={cn(
        "group/source relative my-6 overflow-hidden rounded-lg",
        "[&_.code-figure]:my-0 [&_.code-figure_pre]:max-h-[calc(100svh-20rem)]",
        !expanded && "[&_.code-figure_pre]:max-h-72 [&_.code-figure_pre]:overflow-hidden"
      )}
    >
      {content}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-end justify-center pb-3",
          expanded ? "h-auto bg-transparent" : "h-24 bg-linear-to-t from-card via-card/80 to-transparent"
        )}
      >
        <Button
          variant="secondary"
          size="xs"
          className="rounded-full"
          onPress={() => setExpanded((v) => !v)}
        >
          {expanded ? "Collapse" : "Expand"}
          <ChevronDownIcon
            data-icon="inline-end"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </Button>
      </div>
    </div>
  )
}
