// Synced from shadcn/ui (apps/v4/examples/aria/item-group.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import * as React from "react"
import { AddIcon } from "@tecton/react/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"
import { Button } from "@tecton/react/components/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
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

export function ItemGroupExample() {
  return (
    <ItemGroup className="max-w-sm">
      {people.map((person, index) => (
        <Item key={person.username} variant="outline">
          <ItemMedia>
            <Avatar>
              <AvatarImage src={person.avatar} className="grayscale" />
              <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent className="gap-1">
            <ItemTitle>{person.username}</ItemTitle>
            <ItemDescription>{person.email}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon" className="rounded-full">
              <AddIcon />
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
