"use client"

import * as React from "react"

import { Offline } from "./components/offline"

/** Route-ready offline / connection-lost page. */
export default function OfflinePage() {
  return <Offline />
}

export { Offline, ConnectionChecks } from "./components/offline"
export type { OfflineProps } from "./components/offline"
export { connection, offlineCopy } from "./data"
export type { ConnectionCheck, ConnectionCheckStatus } from "./data"
