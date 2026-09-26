export const offlineCopy = {
  status: "Connection lost",
  protocol: "Offline",
  title: "You're offline.",
  description:
    "The last request didn't reach the server. What you've already opened stays readable; changes you make now are queued and sync as soon as you're back online.",
  workOfflineHref: "#work-offline",
  onlineTitle: "You're back online.",
  onlineDescription:
    "The connection is restored. Queued edits are syncing, and live updates resume.",
}

export type ConnectionCheckStatus = "ok" | "checking" | "failed"

export type ConnectionCheck = {
  id: string
  label: string
  detail: string
  status: ConnectionCheckStatus
}

export const connection = {
  lastSampleAt: "2026-09-12T14:02:36Z",
  /** Seconds between automatic retries. */
  retryEvery: 15,
  queuedEdits: 2,
  checks: [
    {
      id: "network",
      label: "Network",
      detail: "No internet connection",
      status: "failed",
    },
    {
      id: "api",
      label: "Application server",
      detail: "api.example.com",
      status: "failed",
    },
    {
      id: "sync",
      label: "Live updates",
      detail: "Realtime sync",
      status: "failed",
    },
  ] satisfies ConnectionCheck[],
}
