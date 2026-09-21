// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-radio-icons.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { CorporateFareIcon, CreditCardIcon, WalletIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuRadioIcons() {
  const [paymentMethod, setPaymentMethod] = React.useState("card")

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Payment Method</Button>
      <DropdownMenu className="min-w-56">
        <DropdownMenuGroup
          selectionMode="single"
          selectedKeys={[paymentMethod]}
          onSelectionChange={(keys) => setPaymentMethod([...keys][0] as string)}
        >
          <DropdownMenuLabel>Select Payment Method</DropdownMenuLabel>
          <DropdownMenuItem id="card">
            <CreditCardIcon />
            Credit Card
          </DropdownMenuItem>
          <DropdownMenuItem id="paypal">
            <WalletIcon />
            PayPal
          </DropdownMenuItem>
          <DropdownMenuItem id="bank">
            <CorporateFareIcon />
            Bank Transfer
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
