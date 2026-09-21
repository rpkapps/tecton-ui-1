// Synced from shadcn/ui (apps/v4/examples/aria/item-dropdown.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { ChevronDownIcon } from "@tecton/react/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"

const people = [
  {
    username: "alex",
    avatar: "/avatars/01.png",
    email: "alex@example.com",
  },
  {
    username: "jamie",
    avatar: "/avatars/02.png",
    email: "jamie@example.com",
  },
  {
    username: "taylor",
    avatar: "/avatars/03.png",
    email: "taylor@example.com",
  },
]

export function ItemDropdown() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">
        Select <ChevronDownIcon />
      </Button>
      <DropdownMenu className="w-48" placement="bottom end">
        <DropdownMenuGroup>
          {people.map((person) => (
            <DropdownMenuItem key={person.username}>
              <Item size="xs" className="w-full p-2">
                <ItemMedia>
                  <Avatar className="size-(--avatar-size) [--avatar-size:--spacing(6.5)]">
                    <AvatarImage src={person.avatar} className="grayscale" />
                    <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{person.username}</ItemTitle>
                  <ItemDescription className="leading-none">
                    {person.email}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
