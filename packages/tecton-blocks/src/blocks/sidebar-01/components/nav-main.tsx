"use client"

import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
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
} from "@tecton/react/components/sidebar"
import { Link } from "@tecton/react/tecton/link"

import type { NavGroup } from "../data"

/**
 * Grouped navigation. Items with children render as collapsible sections;
 * the rest are plain links with an optional count badge.
 */
function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) =>
              item.items?.length ? (
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
                    <ChevronRightIcon className="ms-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
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
