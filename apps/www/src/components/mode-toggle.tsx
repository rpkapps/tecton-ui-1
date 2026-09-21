"use client"

import { DarkModeIcon, LightModeIcon, MonitorIcon } from "@tecton/react/icons"
import { useTheme } from "next-themes"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon-sm" aria-label="Toggle theme">
        <LightModeIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <DarkModeIcon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
      <DropdownMenu placement="bottom end" className="w-36">
        <DropdownMenuGroup
          selectionMode="single"
          selectedKeys={theme ? [theme] : []}
          onSelectionChange={(keys) => {
            const next = keys === "all" ? undefined : [...keys][0]
            if (typeof next === "string") setTheme(next)
          }}
        >
          <DropdownMenuItem id="dark">
            <DarkModeIcon /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem id="light">
            <LightModeIcon /> Light
          </DropdownMenuItem>
          <DropdownMenuItem id="system">
            <MonitorIcon /> System
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
