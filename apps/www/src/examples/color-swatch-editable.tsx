import * as React from "react"

import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchEditable() {
  const [color, setColor] = React.useState("#cb8553")
  return (
    <ColorSwatch
      color={color}
      onChange={setColor}
      label="Series colour"
      value={color}
      aria-label="Edit series colour"
    />
  )
}
