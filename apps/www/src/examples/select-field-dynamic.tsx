import * as React from "react"

import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"

const horizons = [
  { id: "top-balder", name: "Top Balder", age: "Eocene" },
  { id: "top-sele", name: "Top Sele", age: "Paleocene" },
  { id: "bcu", name: "Base Cretaceous", age: "Cretaceous" },
  { id: "top-brent", name: "Top Brent", age: "Jurassic" },
]

export default function SelectFieldDynamic() {
  const [key, setKey] = React.useState<string | null>("top-sele")
  const current = horizons.find((h) => h.id === key)

  return (
    <SelectField
      className="max-w-xs"
      label="Reference horizon"
      selectedKey={key}
      onSelectionChange={(next) => setKey(next === null ? null : String(next))}
      description={current ? `${current.age} surface` : undefined}
    >
      {horizons.map((horizon) => (
        <SelectFieldItem key={horizon.id} id={horizon.id} textValue={horizon.name}>
          {horizon.name}
        </SelectFieldItem>
      ))}
    </SelectField>
  )
}
