"use client"

import * as React from "react"

import { ServerError } from "./components/server-error"

/** Route-ready 500 page. */
export default function ServerErrorPage() {
  return <ServerError />
}

export { ServerError }
export type { ServerErrorProps } from "./components/server-error"
export { formatErrorReport, serverError, serverErrorCopy } from "./data"
export type { ServerErrorDetails } from "./data"
