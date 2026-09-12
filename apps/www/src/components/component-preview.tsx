"use client"

import * as React from "react"
import { cn } from "cn"
import { I18nProvider } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import { DirectionProvider } from "@tecton/react/components/direction"
import { Spinner } from "@tecton/react/components/spinner"

import { CodeBlock } from "@/components/code-block"
import {
  LanguageProvider,
  LanguageSelector,
  useLanguageContext,
} from "@/components/language-selector"
import { hasExample, loadExample, loadExampleSource } from "@/lib/examples"

const componentCache = new Map<string, Promise<React.ComponentType>>()
const sourceCache = new Map<string, Promise<string>>()

function useExample(name: string) {
  let component = componentCache.get(name)
  if (!component) {
    component = loadExample(name)
    componentCache.set(name, component)
  }
  let source = sourceCache.get(name)
  if (!source) {
    source = loadExampleSource(name)
    sourceCache.set(name, source)
  }
  return { component, source }
}

function Example({ name }: { name: string }) {
  const { component } = useExample(name)
  const Component = React.use(component)
  return <Component />
}

function ExampleSource({ name, maxLines }: { name: string; maxLines?: number }) {
  const { source } = useExample(name)
  const code = React.use(source)
  return <CodeBlock code={code} lang="tsx" maxLines={maxLines} />
}

type ComponentPreviewProps = React.ComponentProps<"div"> & {
  name: string
  align?: "center" | "start" | "end"
  description?: string
  hideCode?: boolean
  type?: "block" | "component" | "example"
  chromeLessOnMobile?: boolean
  previewClassName?: string
  direction?: "ltr" | "rtl"
  caption?: string
  /** Ignored (kept for shadcn docs compatibility). */
  styleName?: string
}

/**
 * Live example + source, like the shadcn docs. `name` is an example file in
 * src/examples; `type="block"` embeds a block in an iframe (`/view/<name>`).
 */
export function ComponentPreview({
  name,
  type,
  className,
  previewClassName,
  align = "center",
  hideCode = false,
  chromeLessOnMobile = false,
  direction = "ltr",
  caption,
  styleName: _styleName,
  ...props
}: ComponentPreviewProps) {
  if (type === "block") {
    const content = (
      <div
        data-not-typeset
        className="relative mt-6 aspect-[4/2.5] w-full overflow-hidden rounded-2xl border bg-background md:-mx-1"
      >
        <iframe
          src={`/view/${name}`}
          title={name}
          className="absolute inset-0 size-full"
          loading="lazy"
        />
      </div>
    )
    return caption ? (
      <figure className="flex flex-col gap-4">
        {content}
        <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>
      </figure>
    ) : (
      content
    )
  }

  if (!hasExample(name)) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Example <code>{name}</code> is not available in this build.
      </p>
    )
  }

  const content = (
    <ComponentPreviewTabs
      className={className}
      previewClassName={previewClassName}
      align={align}
      hideCode={hideCode}
      chromeLessOnMobile={chromeLessOnMobile}
      direction={direction}
      component={
        <React.Suspense fallback={<Spinner className="text-muted-foreground" />}>
          <Example name={name} />
        </React.Suspense>
      }
      source={
        <React.Suspense fallback={<div className="h-24 animate-pulse bg-code" />}>
          <ExampleSource name={name} />
        </React.Suspense>
      }
      sourcePreview={
        <React.Suspense fallback={<div className="h-24 bg-code" />}>
          <ExampleSource name={name} maxLines={3} />
        </React.Suspense>
      }
      {...props}
    />
  )

  if (caption) {
    return (
      <figure data-hide-code={hideCode} className="flex flex-col data-[hide-code=true]:gap-4">
        {content}
        <figcaption className="-mt-8 text-center text-sm text-muted-foreground data-[hide-code=true]:mt-0">
          {caption}
        </figcaption>
      </figure>
    )
  }

  return content
}

function ComponentPreviewTabs({
  className,
  previewClassName,
  align = "center",
  hideCode = false,
  chromeLessOnMobile = false,
  component,
  source,
  sourcePreview,
  direction = "ltr",
  ...props
}: React.ComponentProps<"div"> & {
  previewClassName?: string
  align?: "center" | "start" | "end"
  hideCode?: boolean
  chromeLessOnMobile?: boolean
  component: React.ReactNode
  source: React.ReactNode
  sourcePreview?: React.ReactNode
  direction?: "ltr" | "rtl"
}) {
  const [isMobileCodeVisible, setIsMobileCodeVisible] = React.useState(false)

  const preview = (
    <div data-slot="preview" dir={direction === "rtl" ? undefined : "ltr"}>
      <div
        data-align={align}
        data-chromeless={chromeLessOnMobile}
        className={cn(
          "preview relative flex min-h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-start data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0 sm:data-[align=end]:items-end",
          previewClassName
        )}
      >
        {component}
      </div>
    </div>
  )

  return (
    <div
      data-slot="component-preview"
      data-not-typeset
      className={cn(
        "group relative mt-4 mb-12 flex flex-col overflow-hidden rounded-2xl border",
        className
      )}
      {...props}
    >
      {direction === "rtl" ? (
        <LanguageProvider defaultLanguage="ar">
          <div className="flex h-16 items-center border-b px-4">
            <RtlLanguageSelector />
          </div>
          <RtlPreview>{preview}</RtlPreview>
        </LanguageProvider>
      ) : (
        <DirectionProvider direction="ltr">{preview}</DirectionProvider>
      )}
      {!hideCode && (
        <div
          data-slot="code"
          data-mobile-code-visible={isMobileCodeVisible}
          className="relative overflow-hidden **:data-[slot=copy-button]:right-4 **:data-[slot=copy-button]:hidden data-[mobile-code-visible=true]:**:data-[slot=copy-button]:flex [&_[data-rehype-pretty-code-figure]]:m-0! [&_[data-rehype-pretty-code-figure]]:rounded-t-none [&_[data-rehype-pretty-code-figure]]:border-t [&_pre]:max-h-72"
        >
          {isMobileCodeVisible ? (
            source
          ) : (
            <div className="relative">
              {sourcePreview}
              <div className="absolute inset-0 flex items-center justify-center pb-4">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--color-code), color-mix(in oklab, var(--color-code) 60%, transparent), transparent)",
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="relative z-10 rounded-lg bg-background text-foreground shadow-none hover:bg-muted"
                  onPress={() => setIsMobileCodeVisible(true)}
                >
                  View Code
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RtlPreview({ children }: { children: React.ReactNode }) {
  const context = useLanguageContext()
  const language = context?.language ?? "ar"
  const dir = language === "en" ? "ltr" : "rtl"
  const locale = language === "ar" ? "ar-EG" : language === "he" ? "he-IL" : "en-US"
  return (
    <I18nProvider locale={locale}>
      <DirectionProvider direction={dir}>
        <div dir={dir} data-lang={language}>
          {children}
        </div>
      </DirectionProvider>
    </I18nProvider>
  )
}

function RtlLanguageSelector() {
  const context = useLanguageContext()
  if (!context) return null
  return (
    <LanguageSelector
      className="w-40"
      value={context.language}
      onValueChange={context.setLanguage}
    />
  )
}
