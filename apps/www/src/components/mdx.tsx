import * as React from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "cn"
import type { MDXComponents } from "mdx/types"

import { Button } from "@tecton/react/components/button"
import { Kbd } from "@tecton/react/components/kbd"

import { ComponentPreview } from "@/components/component-preview"
import { ComponentSource } from "@/components/component-source"
import { ComponentsList } from "@/components/components-list"
import {
  CodeBlockCommand,
  getPackageManagerCommands,
} from "@/components/code-block-command"
import { CopyButton } from "@/components/copy-button"
import {
  Callout,
  CodeTabs,
  DocsTabs,
  DocsTabsContent,
  DocsTabsList,
  DocsTabsTrigger,
  LinkedCard,
  Step,
  Steps,
} from "@/components/docs-blocks"
import { Correct, Do, DoList, Dont, Wrong } from "@/components/guideline"
import { IconGallery } from "@/components/icon-gallery"
import { getIconForLanguageExtension } from "@/components/language-icon"
import { PaletteTable } from "@/components/palette-table"
import { TokenTable } from "@/components/token-table"

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }
  return ""
}

function HeadingAnchor({
  id,
  children,
}: {
  id?: string
  children: React.ReactNode
}) {
  if (!id) return children
  return (
    <a className="group no-underline" href={`#${id}`}>
      <span className="underline-offset-4 group-hover:underline">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="ml-2 text-muted-foreground opacity-0 group-hover:opacity-100"
      >
        #
      </span>
    </a>
  )
}

function heading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({
    children,
    id,
    ...props
  }: React.ComponentProps<typeof Tag>) {
    return (
      <Tag id={id} {...props}>
        <HeadingAnchor id={id}>{children}</HeadingAnchor>
      </Tag>
    )
  }
}

function DocsLink({
  href = "",
  className,
  ...props
}: React.ComponentProps<"a">) {
  const isInternal = href.startsWith("/") && !href.startsWith("//")
  if (isInternal) {
    return <Link to={href} className={className} {...(props as object)} />
  }
  const external = href.startsWith("http")
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      {...props}
    />
  )
}

const PACKAGE_MANAGER_LANGUAGES = new Set(["bash", "sh", "shell", "zsh"])

/** The fence language: `data-language` (source.config.ts) or `language-*`. */
function getFenceLanguage(
  props: Record<string, unknown>,
  children: React.ReactNode
): string | null {
  if (typeof props["data-language"] === "string") return props["data-language"]
  let language: string | null = null
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<Record<string, unknown>>(child)) return
    const value = child.props["data-language"]
    const className = child.props.className
    if (typeof value === "string") language = value
    else if (typeof className === "string")
      language = /(?:^|\s)language-(\S+)/.exec(className)?.[1] ?? language
  })
  return language
}

type FenceProps = React.ComponentProps<"pre"> & {
  /** `title="…"` in the fence meta. */
  title?: string
  /** `noCopy` in the fence meta. */
  allowCopy?: string
  "data-language"?: string
  "data-line-numbers"?: boolean | string
  "data-line-numbers-start"?: number | string
}

/**
 * Code fences compiled by fumadocs (rehype-code) arrive as a bare
 * `<pre class="shiki">`. They get the same markup as <CodeBlock />: a
 * `figure[data-code-block]` with an optional title and a copy button. A
 * single-line shell fence with an npm command becomes package-manager tabs.
 */
function Pre({
  className,
  children,
  title,
  allowCopy,
  style,
  ...props
}: FenceProps) {
  const isFence = typeof className === "string" && /\bshiki\b/.test(className)
  if (!isFence) {
    return (
      <pre className={className} style={style} {...props}>
        {children}
      </pre>
    )
  }

  const language = getFenceLanguage(props, children)
  const code = getNodeText(children)
  if (language && PACKAGE_MANAGER_LANGUAGES.has(language)) {
    const commands = getPackageManagerCommands(code)
    if (commands) return <CodeBlockCommand commands={commands} />
  }

  const start = Number(props["data-line-numbers-start"])
  return (
    <figure data-code-block="" data-not-typeset>
      {title && (
        <figcaption
          data-code-block-title=""
          data-language={language ?? undefined}
          className="text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70"
        >
          {language && getIconForLanguageExtension(language)}
          <span className="truncate">{title}</span>
        </figcaption>
      )}
      {allowCopy !== "false" && <CopyButton value={code} />}
      <pre
        className={className}
        style={
          Number.isFinite(start) && start > 1
            ? { ...style, counterReset: `line ${start - 1}` }
            : style
        }
        {...props}
      >
        {children}
      </pre>
    </figure>
  )
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    h4: heading("h4"),
    h5: heading("h5"),
    h6: heading("h6"),
    a: DocsLink,
    pre: Pre,
    // Typeset tables stay real tables; wide ones scroll horizontally.
    table: (props: React.ComponentProps<"table">) => (
      <div className="typeset-scroll no-scrollbar scroll-fade-x *:[table]:w-full">
        <table {...props} />
      </div>
    ),
    ComponentPreview,
    ComponentSource,
    CodeTabs,
    Tabs: DocsTabs,
    TabsList: DocsTabsList,
    TabsTrigger: DocsTabsTrigger,
    TabsContent: DocsTabsContent,
    Steps,
    Step,
    Callout,
    DoList,
    Do,
    Dont,
    Wrong,
    Correct,
    LinkedCard,
    Button: ({ className, ...props }: React.ComponentProps<typeof Button>) => (
      <Button className={cn("not-typeset", className)} {...props} />
    ),
    Kbd,
    ComponentsList,
    IconGallery,
    TokenTable,
    PaletteTable,
    Link: DocsLink,
    Image: ({ className, ...props }: React.ComponentProps<"img">) => (
      <img
        className={cn("mt-6 rounded-2xl border", className)}
        {...props}
        alt={props.alt ?? ""}
      />
    ),
    ...components,
  }
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
