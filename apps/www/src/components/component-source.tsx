"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"

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
  if (!name && !src) return null

  const content = (
    <React.Suspense
      fallback={<div className="mt-6 h-24 animate-pulse rounded-2xl bg-code" />}
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

  if (!collapsible) return <div className={cn("relative", className)}>{content}</div>

  return <CodeCollapsibleWrapper className={className}>{content}</CodeCollapsibleWrapper>
}

export function CodeCollapsibleWrapper({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [isOpened, setIsOpened] = React.useState(false)

  return (
    <div
      data-not-typeset
      data-state={isOpened ? "open" : "closed"}
      className={cn("group/collapsible relative md:-mx-1", className)}
    >
      <div className="absolute top-1.5 right-9 z-10 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-md px-2 text-muted-foreground"
          onPress={() => setIsOpened((v) => !v)}
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
          className="absolute inset-x-0 -bottom-2 flex h-20 items-center justify-center rounded-b-2xl bg-gradient-to-b from-code/70 to-code text-sm text-muted-foreground"
        >
          Expand
        </button>
      )}
    </div>
  )
}
