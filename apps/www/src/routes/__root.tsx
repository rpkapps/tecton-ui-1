import * as React from "react"
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router"
import { TanstackProvider } from "fumadocs-core/framework/tanstack"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@tecton/react/components/sonner"
import { TectonProvider } from "@tecton/react/tecton/provider"

import { siteConfig } from "@/lib/site"
import appCss from "@/styles/app.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteConfig.name },
      { name: "description", content: siteConfig.description },
      { name: "color-scheme", content: "dark light" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-2 p-4">
      <h1 className="text-2xl font-medium">404</h1>
      <p className="text-muted-foreground">
        The requested page could not be found.
      </p>
    </main>
  ),
  shellComponent: RootDocument,
  component: () => <Outlet />,
})

/**
 * An href the TanStack router must not handle: another origin or a scheme
 * (`https:`, `mailto:`…), or a protocol-relative URL.
 */
function isExternalHref(href: string) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)
}

/**
 * Client-side routing for every Tecton link: an internal `href` navigates
 * through the TanStack router instead of a full page load, and a same-page
 * `#anchor` keeps the current path. External hrefs are rendered unchanged.
 */
function SiteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <TectonProvider
      navigate={(href) => {
        if (isExternalHref(href)) {
          window.location.assign(href)
          return
        }
        if (href.startsWith("#")) {
          const { pathname, searchStr } = router.state.location
          void router.navigate({ href: `${pathname}${searchStr}${href}` })
          return
        }
        void router.navigate({ href })
      }}
      useHref={(href) =>
        isExternalHref(href) || href.startsWith("#")
          ? href
          : // `href` (path, search and hash in one string) is supported by
            // buildLocation but missing from its option types.
            router.buildLocation({ href } as Parameters<
              typeof router.buildLocation
            >[0]).href
      }
    >
      {children}
    </TectonProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="[--header-height:calc(var(--spacing)*14)] lg:[--header-height:calc(var(--spacing)*16)]"
    >
      <head>
        <HeadContent />
      </head>
      <body className="group/body min-h-svh overscroll-none bg-background font-sans text-foreground antialiased [--footer-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackProvider>
            <SiteProvider>{children}</SiteProvider>
          </TanstackProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
