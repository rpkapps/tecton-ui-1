import type * as React from "react"
import {
  BoxIcon,
  ChartColumnIcon,
  DrillIcon,
  GitCompareIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MessageSquareIcon,
  MountainIcon,
  SettingsIcon,
} from "lucide-react"

export type NavLink = {
  title: string
  url: string
  icon: React.ElementType
  isActive?: boolean
}

export type RecentProject = {
  id: string
  name: string
  asset: string
  url: string
}

export const navMain: NavLink[] = [
  { title: "Overview", url: "#", icon: LayoutDashboardIcon, isActive: true },
  { title: "Wells", url: "#", icon: DrillIcon },
  { title: "Horizons", url: "#", icon: MountainIcon },
  { title: "Models", url: "#", icon: BoxIcon },
  { title: "Field development", url: "#", icon: GitCompareIcon },
  { title: "Analytics", url: "#", icon: ChartColumnIcon },
]

export const recentProjects: RecentProject[] = [
  { id: "jsp3", name: "Johan Sverdrup Phase 3", asset: "PL 265", url: "#" },
  { id: "troll-w", name: "Troll West", asset: "PL 054", url: "#" },
  { id: "snorre-x", name: "Snorre Expansion", asset: "PL 057", url: "#" },
  { id: "aasgard", name: "Åsgard subsea", asset: "PL 062", url: "#" },
]

export const navSecondary: NavLink[] = [
  { title: "Support", url: "#", icon: LifeBuoyIcon },
  { title: "Feedback", url: "#", icon: MessageSquareIcon },
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
