"use client"

import * as React from "react"

import { SessionExpired } from "./components/session-expired"

/** Route-ready 401 / session-expired page. */
export default function SessionExpiredPage() {
  return <SessionExpired />
}

export { SessionExpired }
export type { SessionExpiredProps } from "./components/session-expired"
export { sessionContext, sessionExpiredCopy } from "./data"
