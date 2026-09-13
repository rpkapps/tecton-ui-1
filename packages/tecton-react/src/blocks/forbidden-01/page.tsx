"use client"

import * as React from "react"

import { Forbidden } from "./components/forbidden"

/** Route-ready 403 page with an inline access request. */
export default function ForbiddenPage() {
  return <Forbidden />
}

export { Forbidden }
export type { ForbiddenProps } from "./components/forbidden"
export { forbiddenContext, forbiddenCopy, validateReason } from "./data"
