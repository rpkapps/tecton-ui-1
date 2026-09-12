import * as React from "react"

import { TextField } from "@tecton/react/tecton/text-field"

const pattern = /^\d{1,2}\/\d{1,2}-[A-Z]-\d{1,2}$/

export default function TextFieldError() {
  const [value, setValue] = React.useState("34/10-A")
  const invalid = value.length > 0 && !pattern.test(value)

  return (
    <TextField
      className="max-w-xs"
      label="Well name"
      value={value}
      onChange={setValue}
      errorMessage={invalid ? "Expected the form 34/10-A-12." : undefined}
      description={invalid ? undefined : "Use the NPD well identifier."}
    />
  )
}
