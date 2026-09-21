"use client"

import * as React from "react"
import {
  AddIcon,
  NotificationsIcon,
  SearchIcon,
  WarningIcon,
} from "@tecton/react/icons"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import { Label } from "@tecton/react/components/label"
import { Slider } from "@tecton/react/components/slider"
import { Switch } from "@tecton/react/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"
import { CircularProgress } from "@tecton/react/tecton/circular-progress"
import { CountBadge } from "@tecton/react/tecton/count-badge"
import { Meter } from "@tecton/react/tecton/meter"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import {
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

export function HeroPreview() {
  const [value, setValue] = React.useState(64)
  return (
    <Panel variant="elevated" className="w-full">
      <PanelHeader>
        <PanelTitle>Well K70 — Spekk fm top</PanelTitle>
        <PanelActions>
          <CountBadge count={3} color="destructive">
            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <NotificationsIcon />
            </Button>
          </CountBadge>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full shadow-md"
          >
            <AddIcon data-icon="inline-start" /> Add
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" size="md">
            Active
          </Badge>
          <Badge variant="info" appearance="outline" size="md">
            Reservoir interval
          </Badge>
          <Button variant="outline" size="xs" className="rounded-full">
            Facies model
          </Button>
        </div>
        <StatGroup>
          <Stat>
            <StatLabel>NPV</StatLabel>
            <StatValue unit="MUSD">248.6</StatValue>
            <StatDelta trend="up">+4.2%</StatDelta>
          </Stat>
          <Stat>
            <StatLabel>CAPEX</StatLabel>
            <StatValue unit="MUSD">91.3</StatValue>
            <StatDelta trend="down">-1.1%</StatDelta>
          </Stat>
          <Stat>
            <StatLabel>Confidence</StatLabel>
            <div className="flex items-center gap-2">
              <CircularProgress
                value={72}
                size="sm"
                color="success"
                aria-label="Confidence"
              />
              <StatValue>72%</StatValue>
            </div>
          </Stat>
        </StatGroup>
        <Tabs defaultSelectedKey="design">
          <TabsList>
            <TabsTrigger id="design">Design</TabsTrigger>
            <TabsTrigger id="risk">Risk</TabsTrigger>
          </TabsList>
          <TabsContent id="design" className="flex flex-col gap-4 pt-3">
            <Slider
              aria-label="Variogram range"
              value={value}
              onChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
              minValue={0}
              maxValue={100}
            />
            <div className="flex items-center gap-3">
              <Input placeholder="Search horizons…" aria-label="Search" />
              <Button variant="outline" size="icon" aria-label="Search">
                <SearchIcon />
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="hero-hidden" />
                <Label htmlFor="hero-hidden">Show hidden items</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="hero-auto" defaultSelected />
                <Label htmlFor="hero-auto">Auto-update</Label>
              </div>
            </div>
          </TabsContent>
          <TabsContent id="risk" className="flex flex-col gap-3 pt-3">
            <Meter
              aria-label="Risk"
              label="Risk"
              value={68}
              color="auto"
              showValue
            />
            <Meter
              aria-label="Complexity"
              label="Complexity"
              value={35}
              color="auto"
              showValue
            />
          </TabsContent>
        </Tabs>
        <Alert variant="warning" appearance="outline">
          <WarningIcon />
          <AlertTitle>Model out of date</AlertTitle>
          <AlertDescription>
            Horizon K70 changed after the last run.
          </AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="xs">
              Re-run
            </Button>
          </AlertAction>
        </Alert>
      </PanelContent>
    </Panel>
  )
}
