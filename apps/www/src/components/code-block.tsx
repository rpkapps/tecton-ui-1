"use client"

import * as React from "react"
import { cn } from "cn"

import { CopyButton } from "@/components/copy-button"
import { getIconForLanguageExtension } from "@/components/language-icon"
import { highlightCode } from "@/lib/highlight"

/** `null`: highlighting failed, render the plain code. */
const cache = new Map<string, Promise<string | null>>()

/**
 * A promise in the state React's `use()` reads synchronously: an entry seeded
 * from the server-rendered HTML never suspends.
 */
function fulfilled<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), {
    status: "fulfilled" as const,
    value,
  })
}

/** A short, stable key for a code block (FNV-1a over language and code). */
function highlightKey(code: string, lang: string) {
  const input = `${lang}\n${code}`
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${lang}-${(hash >>> 0).toString(36)}-${input.length.toString(36)}`
}

/**
 * The highlighted HTML the server rendered into the page, keyed like the
 * cache: reusing it saves a server-function round trip per code block.
 * Read when this module loads, before hydration: an update above a
 * still-dehydrated Suspense boundary (next-themes resolving a light theme,
 * say) makes React discard the server HTML and render that boundary again on
 * the client, so the DOM cannot be read later.
 */
const serverHtml = new Map<string, string>()
if (typeof document !== "undefined") {
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-highlight-key]"
  )) {
    const key = element.dataset.highlightKey
    if (key && element.innerHTML) serverHtml.set(key, element.innerHTML)
  }
}

export function getHighlighted(code: string, lang: string) {
  const key = highlightKey(code, lang)
  let promise = cache.get(key)
  if (!promise) {
    const html = serverHtml.get(key)
    if (html) {
      promise = fulfilled(html)
    } else {
      promise = highlightCode({ data: { code, lang } }).catch(() => {
        // Retry on the next mount; this render falls back to plain code.
        cache.delete(key)
        return null
      })
    }
    cache.set(key, promise)
  }
  return { key, promise }
}

function PlainCode({ code, lang }: { code: string; lang: string }) {
  return (
    <pre data-language={lang}>
      <code data-language={lang}>
        {code.split("\n").map((line, i) => (
          <span key={i} data-line="">
            {line}
          </span>
        ))}
      </code>
    </pre>
  )
}

function Highlighted({ code, lang }: { code: string; lang: string }) {
  const { key, promise } = getHighlighted(code, lang)
  const html = React.use(promise)
  if (html === null) return <PlainCode code={code} lang={lang} />
  return (
    <div
      data-not-typeset
      data-highlight-key={key}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Renders the plain code when highlighting throws (it never breaks the page). */
class HighlightBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Highlighted source with an optional file title and a copy button, rendered
 * with the same markup as an MDX code fence (`figure[data-code-block]`).
 */
export function CodeBlock({
  code,
  lang = "tsx",
  title,
  className,
  maxLines,
  copyable = true,
}: {
  code: string
  lang?: string
  title?: string
  className?: string
  maxLines?: number
  copyable?: boolean
}) {
  const shown = maxLines ? code.split("\n").slice(0, maxLines).join("\n") : code
  const plain = <PlainCode code={shown} lang={lang} />

  return (
    <figure
      data-code-block=""
      data-not-typeset
      className={cn("[&>div>pre]:max-h-96", className)}
    >
      {title && (
        <figcaption
          data-code-block-title=""
          data-language={lang}
          className="text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70"
        >
          {getIconForLanguageExtension(lang)}
          <span className="truncate">{title}</span>
        </figcaption>
      )}
      {copyable && <CopyButton value={code} />}
      <HighlightBoundary key={`${lang} ${shown}`} fallback={plain}>
        <React.Suspense fallback={plain}>
          <Highlighted code={shown} lang={lang} />
        </React.Suspense>
      </HighlightBoundary>
    </figure>
  )
}
