// Synced from shadcn/ui (apps/v4/examples/aria/breadcrumb-dropdown.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import Link from "@/components/shims/link"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@tecton/react/components/button"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@tecton/react/components/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function BreadcrumbDropdown() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/"
            render={(props) =>
              "href" in props ? <Link {...props} /> : <span {...props} />
            }
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="sm">
              Components
              <ChevronDownIcon data-icon="inline-end" className="size-3.5" />
            </Button>
            <DropdownMenu placement="bottom start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
                <DropdownMenuItem>GitHub</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
