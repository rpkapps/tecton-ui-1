export const serverErrorCopy = {
  status: "Server error",
  protocol: "HTTP 500",
  title: "Something went wrong on our side.",
  description:
    "The server ran into a problem while handling your request. We've been notified automatically. Try again in a moment, or continue with the last saved view.",
  cachedHref: "#cached-view",
  statusHref: "#status",
}

export type ServerErrorDetails = {
  errorId: string
  service: string
  occurredAt: string
  /** What the user was doing; goes into the copied report. */
  operation: string
  route: string
  stack: string
}

export const serverError: ServerErrorDetails = {
  errorId: "err_5e1c9b2a7f",
  service: "api · eu-north-1b",
  occurredAt: "2026-09-12T14:02:36Z",
  operation: "GET /api/v2/reports/summary",
  route: "/reports/summary",
  stack: `UpstreamTimeoutError: upstream did not answer within 8000 ms
    at ReportLoader.fetch (report-loader.ts:112:15)
    at async SummaryRoute.loader (summary.route.ts:41:22)
    at async Router.load (router.ts:788:9)
  request: GET /api/v2/reports/summary
  trace:   4c1d8f0a9e3b7c2d`,
}

/** Plain-text report for the "Copy error details" action. */
export function formatErrorReport(details: ServerErrorDetails) {
  return [
    `Error ID:  ${details.errorId}`,
    `Service:   ${details.service}`,
    `Time:      ${details.occurredAt}`,
    `Operation: ${details.operation}`,
    `Route:     ${details.route}`,
    "",
    details.stack,
  ].join("\n")
}
