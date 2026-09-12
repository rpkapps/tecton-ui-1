import * as React from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "cn"
import type { MDXComponents } from "mdx/types"

import { Button } from "@tecton/react/components/button"
import { Kbd } from "@tecton/react/components/kbd"

import { ComponentPreview } from "@/components/component-preview"
import { ComponentSource } from "@/components/component-source"
import {
  Callout,
  CodeTabs,
  DocsTabs,
  DocsTabsContent,
  DocsTabsList,
  DocsTabsTrigger,
  Step,
  Steps,
} from "@/components/docs-blocks"
import { CopyButton } from "@tecton/react/tecton/copy-button"
import { ComponentsList } from "@/components/components-list"
import { IconGallery } from "@/components/icon-gallery"
import { TokenTable } from "@/components/token-table"

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }
  return ""
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

/** Code fences compiled by fumadocs (rehype-code) arrive as <figure><pre><code>. */
function Figure({ className, children, ...props }: React.ComponentProps<"figure">) {
  const isCode = "data-rehype-pretty-code-figure" in props
  const code = isCode ? getNodeText(children) : ""
  return (
    <figure className={cn("group/code", className)} {...props}>
      {isCode && (
        <CopyButton
          value={code}
          data-slot="copy-button"
          className="absolute top-1.5 right-1.5 z-10 bg-card/80 opacity-0 transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100 data-[copied=true]:opacity-100 [figure:has(figcaption)_&]:top-1"
        />
      )}
      {children}
    </figure>
  )
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    a: DocsLink,
    figure: Figure,
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
    Button,
    Kbd,
    ComponentsList,
    IconGallery,
    TokenTable,
    Link: DocsLink,
    Image: (props: React.ComponentProps<"img">) => (
      <img {...props} alt={props.alt ?? ""} />
    ),
    ...components,
  }
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
