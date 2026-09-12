import type * as React from "react"
import {
  BoxIcon,
  ChartColumnIcon,
  DrillIcon,
  GitCompareIcon,
  LayoutDashboardIcon,
  MountainIcon,
  SettingsIcon,
} from "lucide-react"

export type RailItem = {
  title: string
  url: string
  icon: React.ElementType
  isActive?: boolean
}

export type WellType = "producer" | "injector" | "exploration"

export type WellProperties = {
  name: string
  type: WellType
  color: string
  kickOffDepth: number
  includeInFda: boolean
  showTrajectory: boolean
}

export const railMain: RailItem[] = [
  { title: "Overview", url: "#", icon: LayoutDashboardIcon },
  { title: "Wells", url: "#", icon: DrillIcon, isActive: true },
  { title: "Horizons", url: "#", icon: MountainIcon },
  { title: "Models", url: "#", icon: BoxIcon },
  { title: "Field development", url: "#", icon: GitCompareIcon },
  { title: "Analytics", url: "#", icon: ChartColumnIcon },
]

export const railSecondary: RailItem[] = [
  { title: "Settings", url: "#", icon: SettingsIcon },
]

export const wellTypes: { id: WellType; label: string }[] = [
  { id: "producer", label: "Producer" },
  { id: "injector", label: "Injector" },
  { id: "exploration", label: "Exploration" },
]

export const defaultWell: WellProperties = {
  name: "34/10-A-12 H",
  type: "producer",
  color: "#29A6A6",
  kickOffDepth: 1850,
  includeInFda: true,
  showTrajectory: true,
}

export const currentUser = {
  name: "Lena Haugen",
  initials: "LH",
  role: "Subsurface lead",
  email: "lena.haugen@example.com",
}
