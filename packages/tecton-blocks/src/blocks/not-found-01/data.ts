export const notFoundCopy = {
  status: "Not found",
  protocol: "HTTP 404",
  title: "We couldn't find that page.",
  description:
    "The address may be mistyped, the link may be out of date, or the page may have been moved or removed.",
  homeHref: "/",
  reportHref: "#report-link",
}

/** Diagnostics shown in the footer; an application fills these from the router / request. */
export const notFoundRequest = {
  path: "/reports/summary",
  requestId: "req_8f2a91c4",
  /** Pages that usually match a stale link. */
  suggestions: [
    { label: "Home", href: "/" },
    { label: "Help centre", href: "#help" },
  ],
}
