"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/button"
import { Separator } from "@tecton/react/separator"

import { CodeBlock } from "@/components/code-block"
import { getExampleSource } from "@/lib/examples"
import { preloadMarker, readable } from "@/lib/preload"
import { hasSource, loadSource, sourceTitle } from "@/lib/sources"

const cache = new Map<string, Promise<string>>()

/** What a `<ComponentSource>` shows: `src:<path>` or `name:<name>`. */
function sourceKey(name: string | undefined, src: string | undefined) {
  return src ? `src:${src}` : `name:${name}`
}

/**
 * The source at `key` (`sourceKey()`), loaded once, for `use()`
 * (lib/preload.ts); "" when it cannot be loaded.
 */
export function getComponentSource(key: string) {
  let promise = cache.get(key)
  if (!promise) {
    const value = key.slice(key.indexOf(":") + 1)
    const name = key.startsWith("name:") ? value : undefined
    let source: Promise<string>
    if (!name) {
      source = loadSource(value)
    } else if (hasSource(`components/${name}`)) {
      source = loadSource(`components/${name}`)
    } else if (hasSource(`tecton/${name}`)) {
      source = loadSource(`tecton/${name}`)
    } else {
      source = getExampleSource(name)
    }
    promise = readable(source.catch(() => ""))
    cache.set(key, promise)
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
  const code = React.use(getComponentSource(sourceKey(name, src)))
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
  if (!name && !src) return null

  const marker = preloadMarker("source", sourceKey(name, src))
  const content = (
    <React.Suspense
      fallback={<div className="bg-code mt-6 h-24 animate-pulse rounded-2xl" />}
    >
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

  if (!collapsible)
    return (
      <div className={cn("relative", className)} {...marker}>
        {content}
      </div>
    )

  return (
    <CodeCollapsibleWrapper className={className} {...marker}>
      {content}
    </CodeCollapsibleWrapper>
  )
}

export function CodeCollapsibleWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const [isOpened, setIsOpened] = React.useState(false)

  return (
    <div
      data-not-typeset
      data-state={isOpened ? "open" : "closed"}
      className={cn("group/collapsible relative md:-mx-1", className)}
      {...props}
    >
      <div className="absolute top-1.5 right-9 z-10 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-md px-2 text-muted-foreground"
          onClick={() => setIsOpened((v) => !v)}
        >
          {isOpened ? "Collapse" : "Expand"}
        </Button>
        <Separator orientation="vertical" className="mx-1.5 h-4!" />
      </div>
      <div className="relative mt-6 overflow-hidden group-data-[state=closed]/collapsible:max-h-64 [&>figure]:mt-0 [&>figure]:md:mx-0!">
        {children}
      </div>
      {!isOpened && (
        <button
          type="button"
          onClick={() => setIsOpened(true)}
          className="from-code/70 to-code absolute inset-x-0 -bottom-2 flex h-20 items-center justify-center rounded-b-2xl bg-gradient-to-b text-sm text-muted-foreground"
        >
          Expand
        </button>
      )}
    </div>
  )
}
