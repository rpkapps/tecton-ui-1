"use client"

import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@tecton/react/components/sidebar"
import { Link } from "@tecton/react/tecton/link"

import type { NavGroup, NavItem } from "../data"

/**
 * An item with children while the rail is collapsed to icons: the inline
 * sub-list has no room, so the row opens its children in a menu beside the
 * rail instead (on hover, like the tooltips of the other rows, or on click).
 */
function NavFlyout({ item }: { item: NavItem }) {
  const items = item.items ?? []
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          render={
            <SidebarMenuButton
              isActive={items.some((subItem) => subItem.isActive)}
              className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
            />
          }
        >
          <item.icon />
          <span>{item.title}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="inline-end"
          align="start"
          sideOffset={4}
          className="w-auto min-w-48 rounded-lg"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            {items.map((subItem) => (
              <DropdownMenuItem
                key={subItem.title}
                aria-current={subItem.isActive ? "page" : undefined}
                className="aria-[current=page]:font-medium"
                // The menu item draws the highlight: drop the link's own
                // underline and focus ring.
                render={
                  <Link
                    href={subItem.url}
                    className="hover:no-underline focus-visible:ring-0"
                  />
                }
              >
                {subItem.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

/**
 * Grouped navigation. Items with children render as collapsible sections
 * (a flyout menu while the rail is collapsed to icons); the rest are plain
 * links with an optional count badge.
 */
function NavMain({ groups }: { groups: NavGroup[] }) {
  const { isMobile, state } = useSidebar()
  const iconRail = state === "collapsed" && !isMobile

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) =>
              item.items?.length && iconRail ? (
                <NavFlyout key={item.title} item={item} />
              ) : item.items?.length ? (
                <Collapsible
                  key={item.title}
                  defaultOpen={item.isActive ?? false}
                  className="group/collapsible"
                  render={<SidebarMenuItem />}
                >
                  <CollapsibleTrigger
                    render={<SidebarMenuButton tooltip={item.title} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ms-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-open/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={subItem.isActive ?? false}
                            render={
                              <Link
                                href={subItem.url}
                                className="hover:no-underline"
                              />
                            }
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive ?? false}
                    tooltip={item.title}
                    render={
                      <Link href={item.url} className="hover:no-underline" />
                    }
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

export { NavMain }
