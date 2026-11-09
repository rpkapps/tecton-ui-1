import * as React from "react"
import { SearchIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import {
  RadioGroup,
  RadioGroupItem,
} from "@tecton/react/components/radio-group"
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

import { colormapGroups, colormaps } from "./colormaps"
import { ColormapBar, ScalePreview } from "./parts"

/** 08 — A side panel list: search and family filters over rows of scales. */
export default function PickerPanelList() {
  const [map, setMap] = React.useState("res2d")
  const [query, setQuery] = React.useState("")
  const [family, setFamily] = React.useState("all")
  const visible = colormaps.filter(
    (m) =>
      (family === "all" ||
        (family === "safe" ? m.cvdSafe : m.group === family)) &&
      `${m.name} ${m.note}`.toLowerCase().includes(query.trim().toLowerCase())
  )
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ScalePreview map={map} />
      <Panel variant="outline" size="sm" className="h-[30rem]">
        <PanelHeader className="flex-col items-stretch gap-3">
          <PanelTitle>Colour scale</PanelTitle>
          <InputGroup>
            <InputGroupInput
              aria-label="Search colour scales"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <ChipGroup
            aria-label="Filter by family"
            selectionMode="single"
            disallowEmptySelection
            value={[family]}
            onValueChange={(next) => setFamily(next[0] ?? "all")}
          >
            <ChipList className="flex-wrap">
              <Chip value="all">All</Chip>
              {colormapGroups.map((g) => (
                <Chip key={g.id} value={g.id}>
                  {g.name}
                </Chip>
              ))}
              <Chip value="safe">CVD safe</Chip>
            </ChipList>
          </ChipGroup>
        </PanelHeader>
        <PanelContent>
          {visible.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No colour scales</EmptyTitle>
                <EmptyDescription>
                  Nothing matches “{query}”. Clear the search or the filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <RadioGroup
              aria-label="Colour scales"
              value={map}
              onValueChange={(next) => setMap(next as string)}
              className="gap-1"
            >
              {visible.map((m) => (
                <Item
                  key={m.id}
                  size="xs"
                  variant={m.id === map ? "muted" : "default"}
                  render={<label htmlFor={`p8-${m.id}`} />}
                >
                  <ItemMedia>
                    <ColormapBar id={m.id} className="h-4 w-14" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {m.name}
                      {m.cvdSafe ? (
                        <Badge variant="secondary">CVD safe</Badge>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription>{m.note}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <RadioGroupItem value={m.id} id={`p8-${m.id}`} />
                  </ItemActions>
                </Item>
              ))}
            </RadioGroup>
          )}
        </PanelContent>
      </Panel>
    </div>
  )
}
