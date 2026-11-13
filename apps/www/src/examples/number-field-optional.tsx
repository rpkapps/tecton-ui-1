"use client"

import * as React from "react"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@tecton/react/number-field"

export default function NumberFieldOptional() {
  const [limit, setLimit] = React.useState<number | null>(null)
  return (
    <div className="flex max-w-48 flex-col gap-2">
      <NumberField value={limit} onValueChange={setLimit} min={0}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Row limit" placeholder="No limit" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <p className="text-sm text-muted-foreground">
        Value: {limit === null ? "null" : limit}
      </p>
    </div>
  )
}
