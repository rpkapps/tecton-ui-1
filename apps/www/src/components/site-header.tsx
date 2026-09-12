"use client"

import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "cn"
import { MenuIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

import { CommandMenu } from "@/components/command-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { TectonLogo } from "@/components/tecton-logo"
import { siteConfig } from "@/lib/site"

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-(--breakpoint-2xl) items-center gap-2 px-4 md:px-6">
        <MobileNav pathname={pathname} />
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <TectonLogo className="size-5" />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 text-sm md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
                isActive(pathname, item.href) && "text-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <CommandMenu />
          <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

function isActive(pathname: string, href: string) {
  if (href === "/docs") {
    return (
      pathname === "/docs" ||
      (pathname.startsWith("/docs/") &&
        !pathname.startsWith("/docs/components") &&
        !pathname.startsWith("/docs/tecton"))
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <SheetTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon />
      </Button>
      <Sheet side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TectonLogo className="size-5" />
            {siteConfig.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2 text-sm">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground",
                isActive(pathname, item.href) && "bg-accent text-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </Sheet>
    </SheetTrigger>
  )
}
