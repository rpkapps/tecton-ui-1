/** Copy for the scaffold demo: a page that is not available yet. */
export const comingSoon = {
  title: "This page isn't available yet.",
  description:
    "We're still building it. Come back a little later, or let us know you're interested and we'll tell you as soon as it's ready.",
  route: "/reports/advanced",
}

/** Formats an ISO timestamp for the diagnostics footer (`2026-09-12 14:02 UTC`). */
export function formatTimestamp(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}
