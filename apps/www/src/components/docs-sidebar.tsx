"use client"

import * as React from "react"
import { useRouterState } from "@tanstack/react-router"
import type * as PageTree from "fumadocs-core/page-tree"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@tecton/react/components/sidebar"

import { getPagesFromFolder, getRootFolders, getRootPages, nodeName } from "@/lib/tree"

const SCROLL_KEY = "tecton-docs:sidebar-scroll"

function readScrollState() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "") as {
      pathname: string
      scrollTop: number
    }
  } catch {
    return null
  }
}

function saveScrollState(container: HTMLElement) {
  try {
    sessionStorage.setItem(
      SCROLL_KEY,
      JSON.stringify({ pathname: location.pathname, scrollTop: container.scrollTop })
    )
  } catch {
    // ignore
  }
}

const itemClassName =
  "relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md data-[active=true]:border-accent data-[active=true]:bg-accent"

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton href={href} isActive={active} className={itemClassName}>
        <span className="absolute inset-0 flex w-(--sidebar-menu-width) bg-transparent" />
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function DocsSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: PageTree.Root }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const container = contentRef.current
    if (!container) return

    const scrollState = readScrollState()
    if (scrollState?.pathname === pathname) {
      container.scrollTop = scrollState.scrollTop
    } else {
      const active = container.querySelector<HTMLElement>('[data-active="true"]')
      if (active) {
        const containerRect = container.getBoundingClientRect()
        const activeRect = active.getBoundingClientRect()
        if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
          container.scrollTop +=
            activeRect.top - containerRect.top - (container.clientHeight - activeRect.height) / 2
        }
      }
    }
    saveScrollState(container)
  }, [pathname])

  React.useEffect(() => {
    const container = contentRef.current
    if (!container) return
    const onScroll = () => saveScrollState(container)
    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  const sections = getRootPages(tree)
  const folders = getRootFolders(tree)

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+0.6rem)] z-30 hidden h-[calc(100svh-10rem)] overflow-hidden overscroll-none bg-transparent [--sidebar-menu-width:--spacing(56)] lg:flex"
      collapsible="none"
      {...props}
    >
      <div className="absolute top-12 right-2 bottom-0 hidden h-full w-px bg-[linear-gradient(to_bottom,transparent_0%,var(--border)_10%,var(--border)_90%,transparent_100%)] lg:flex" />
      <SidebarContent
        ref={contentRef}
        data-docs-sidebar-content=""
        className="w-(--sidebar-menu-width) scroll-fade no-scrollbar overflow-x-hidden pl-2.5"
      >
        <SidebarGroup className="pt-12">
          <SidebarGroupLabel className="font-medium text-muted-foreground">
            Sections
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((page) => (
                <SidebarLink
                  key={page.url}
                  href={page.url}
                  active={
                    page.url === "/docs" ? pathname === page.url : pathname.startsWith(page.url)
                  }
                >
                  {nodeName(page)}
                </SidebarLink>
              ))}
              {folders
                .filter((folder) => folder.index)
                .map((folder) => (
                  <SidebarLink
                    key={folder.index!.url}
                    href={folder.index!.url}
                    active={pathname === folder.index!.url}
                  >
                    {nodeName(folder)}
                  </SidebarLink>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {folders.map((folder) => {
          const pages = getPagesFromFolder(folder)
          if (!pages.length) return null
          return (
            <SidebarGroup key={folder.$id ?? nodeName(folder)}>
              <SidebarGroupLabel className="font-medium text-muted-foreground">
                {nodeName(folder)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {pages.map((page) => (
                    <SidebarLink key={page.url} href={page.url} active={page.url === pathname}>
                      {nodeName(page)}
                    </SidebarLink>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
