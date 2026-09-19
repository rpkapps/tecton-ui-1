"use client"

import * as React from "react"

import { NotFound } from "./components/not-found"

/** Route-ready 404 page. */
export default function NotFoundPage() {
  return <NotFound />
}

export { NotFound }
export type { NotFoundProps } from "./components/not-found"
export { notFoundCopy, notFoundRequest } from "./data"
