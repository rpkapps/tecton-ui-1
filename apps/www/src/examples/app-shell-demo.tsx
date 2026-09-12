import { HexagonIcon } from "lucide-react"

import {
  AppShell,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"

export default function AppShellDemo() {
  return (
    <AppShell className="h-64 w-full max-w-2xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellMain className="p-4 text-sm text-muted-foreground">Work area</AppShellMain>
      </AppShellBody>
    </AppShell>
  )
}
