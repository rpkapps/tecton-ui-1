"use client"

import * as React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@tecton/react/components/breadcrumb"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  AppShell,
  AppShellBody,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"

import { ShellHeader } from "./components/shell-header"
import { apps } from "./data"
import type { ShellApp } from "./data"

/**
 * The micro-frontend host shell: a top bar owned by the host (app finder,
 * home, context, command palette, help, release notes, bug report,
 * settings and the user menu) and one region below that the mounted
 * application fills with its own layout.
 */
export default function Page() {
  const [app, setApp] = React.useState<ShellApp>(apps[0])

  return (
    <AppShell>
      <ShellHeader appId={app.id} onAppChange={setApp}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{app.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Orion Discovery</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ShellHeader>
      <AppShellBody>
        <AppShellMain className="flex">
          <Empty className="m-auto max-w-md">
            <EmptyHeader>
              <EmptyTitle>{app.name} mounts here</EmptyTitle>
              <EmptyDescription>
                The shell owns the header. Everything below it belongs to the
                application, which chooses its own page layout.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  )
}

export { ShellHeader } from "./components/shell-header"
export { ShellCommandPalette } from "./components/shell-command-palette"
export {
  apps,
  appCategories,
  commands,
  currentUser,
  groupApps,
  recentAppIds,
} from "./data"
export type { AppCategory, ShellApp, ShellCommand, ShellUser } from "./data"
