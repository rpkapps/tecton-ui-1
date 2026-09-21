import {
  ChatIcon,
  CubeIcon,
  DashboardIcon,
  DifferenceIcon,
  DrillBitIcon,
  HorizonIcon,
  ReportsAnalyticsIcon,
  SettingsIcon,
  SupportIcon,
} from "@tecton/react/icons"
import type { TectonIconComponent } from "@tecton/react/icons"

export type NavLink = {
  title: string
  url: string
  icon: TectonIconComponent
  isActive?: boolean
}

export type RecentProject = {
  id: string
  name: string
  asset: string
  url: string
}

export const navMain: NavLink[] = [
  { title: "Overview", url: "#", icon: DashboardIcon, isActive: true },
  { title: "Wells", url: "#", icon: DrillBitIcon },
  { title: "Horizons", url: "#", icon: HorizonIcon },
  { title: "Models", url: "#", icon: CubeIcon },
  { title: "Field development", url: "#", icon: DifferenceIcon },
  { title: "Analytics", url: "#", icon: ReportsAnalyticsIcon },
]

export const recentProjects: RecentProject[] = [
  { id: "jsp3", name: "Johan Sverdrup Phase 3", asset: "PL 265", url: "#" },
  { id: "troll-w", name: "Troll West", asset: "PL 054", url: "#" },
  { id: "snorre-x", name: "Snorre Expansion", asset: "PL 057", url: "#" },
  { id: "aasgard", name: "Åsgard subsea", asset: "PL 062", url: "#" },
]

export const navSecondary: NavLink[] = [
  { title: "Support", url: "#", icon: SupportIcon },
  { title: "Feedback", url: "#", icon: ChatIcon },
  { title: "Settings", url: "#", icon: SettingsIcon },
]

export const currentUser = {
  name: "Lena Haugen",
  initials: "LH",
  role: "Subsurface lead",
  email: "lena.haugen@example.com",
}

export const breadcrumbs = [
  { title: "Johan Sverdrup Phase 3", url: "#" },
  { title: "Overview" },
]
