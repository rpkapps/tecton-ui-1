"use client"

import * as React from "react"

import { Maintenance } from "./components/maintenance"

/** Route-ready 503 / scheduled maintenance page. */
export default function MaintenancePage() {
  return <Maintenance />
}

export { Maintenance, MaintenanceSteps } from "./components/maintenance"
export type { MaintenanceProps } from "./components/maintenance"
export { maintenanceCopy, maintenanceWindow } from "./data"
export type { MaintenanceStep, MaintenanceStepStatus } from "./data"
