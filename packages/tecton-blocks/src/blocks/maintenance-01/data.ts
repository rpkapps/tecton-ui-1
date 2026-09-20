export const maintenanceCopy = {
  status: "Scheduled maintenance",
  protocol: "HTTP 503",
  title: "Down for scheduled maintenance.",
  description:
    "We're upgrading our systems. The application is unavailable until the maintenance window closes; nothing you saved is affected.",
  statusHref: "#status",
}

export type MaintenanceStepStatus = "done" | "active" | "pending"

export type MaintenanceStep = {
  id: string
  title: string
  description: string
  status: MaintenanceStepStatus
}

export const maintenanceWindow = {
  startedAt: "2026-09-12T02:00:00Z",
  endsAt: "2026-09-12T06:00:00Z",
  /** Progress through the window, 0–100. */
  progress: 62,
  remaining: "1 h 20 min",
  ticket: "CHG-40821",
  steps: [
    {
      id: "backup",
      title: "Back up data",
      description: "A consistent snapshot before anything changes.",
      status: "done",
    },
    {
      id: "upgrade",
      title: "Upgrade database",
      description: "Rolling upgrade, three of five nodes migrated.",
      status: "active",
    },
    {
      id: "reindex",
      title: "Rebuild search index",
      description: "Search comes back last.",
      status: "pending",
    },
    {
      id: "verify",
      title: "Verify and reopen",
      description: "Smoke tests, then the application is back.",
      status: "pending",
    },
  ] satisfies MaintenanceStep[],
}
