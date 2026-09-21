import {
  CubeIcon,
  DashboardIcon,
  DifferenceIcon,
  DrillBitIcon,
  HorizonIcon,
  ReportsAnalyticsIcon,
  SettingsIcon,
} from "@tecton/react/icons"
import type { TectonIconComponent } from "@tecton/react/icons"

export type RailItem = {
  title: string
  url: string
  icon: TectonIconComponent
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
  { title: "Overview", url: "#", icon: DashboardIcon },
  { title: "Wells", url: "#", icon: DrillBitIcon, isActive: true },
  { title: "Horizons", url: "#", icon: HorizonIcon },
  { title: "Models", url: "#", icon: CubeIcon },
  { title: "Field development", url: "#", icon: DifferenceIcon },
  { title: "Analytics", url: "#", icon: ReportsAnalyticsIcon },
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
