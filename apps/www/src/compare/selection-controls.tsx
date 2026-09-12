import * as React from "react"

import { Checkbox } from "@tecton/react/components/checkbox"
import { RadioGroup, RadioGroupItem } from "@tecton/react/components/radio-group"
import { Switch } from "@tecton/react/components/switch"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 039_components-checkbox__variant-matrix.png plus the Radio and
 * Switch matrices (same Storybook family).
 *
 * Checkbox: blocks Unchecked · Indeterminate · Checked, rows Medium / Small,
 * Storybook columns Enabled · Hovered · Focused · Pressed · Disabled (only
 * Enabled and Disabled rendered).
 * Radio:    blocks Medium / Small, columns Unchecked · Checked · Disabled ·
 *           Disabled checked.
 * Switch:   blocks Medium / Small, columns Off · On · Disabled off ·
 *           Disabled on.
 */
const checkboxStates = [
  { label: "Unchecked", props: {} },
  { label: "Indeterminate", props: { isIndeterminate: true } },
  { label: "Checked", props: { defaultSelected: true } },
] as const

const checkboxSizes = [
  { label: "Medium", className: undefined },
  { label: "Small", className: "size-3.5 [&_svg]:size-3" },
] as const

function Radio({
  checked,
  disabled,
  small,
}: {
  checked?: boolean
  disabled?: boolean
  small?: boolean
}) {
  return (
    <RadioGroup
      aria-label="Radio"
      className="w-auto"
      defaultValue={checked ? "on" : undefined}
      isDisabled={disabled}
    >
      <RadioGroupItem
        value="on"
        aria-label="Option"
        className={small ? "size-3.5 [&_[data-slot=radio-group-indicator]]:size-3.5 [&_[data-slot=radio-group-indicator]>span]:size-1.5" : undefined}
      />
    </RadioGroup>
  )
}

export default function SelectionControlsMatrix() {
  return (
    <Page>
      <Section title="Checkbox Variants">
        {checkboxStates.map(({ label, props }) => (
          <Section
            key={label}
            title={<span className="text-base">{label}</span>}
          >
            <Matrix
              columns={["Enabled", "Disabled"]}
              rows={checkboxSizes.map(({ label: sizeLabel, className }) => ({
                label: sizeLabel,
                cells: [
                  <Checkbox
                    key="enabled"
                    aria-label={`${label} ${sizeLabel}`}
                    className={className}
                    {...props}
                  />,
                  <Checkbox
                    key="disabled"
                    aria-label={`${label} ${sizeLabel} disabled`}
                    className={className}
                    isDisabled
                    {...props}
                  />,
                ],
              }))}
            />
          </Section>
        ))}
        <Caption>
          Hovered, Focused and Pressed columns from Storybook are omitted.
        </Caption>
      </Section>

      <Section title="Radio">
        {[false, true].map((small) => (
          <Matrix
            key={String(small)}
            title={small ? "Small" : "Medium"}
            columns={["Unchecked", "Checked", "Disabled", "Disabled checked"]}
            rows={[
              {
                label: small ? "sm" : "md",
                cells: [
                  <Radio key="unchecked" small={small} />,
                  <Radio key="checked" small={small} checked />,
                  <Radio key="disabled" small={small} disabled />,
                  <Radio key="disabled-checked" small={small} checked disabled />,
                ],
              },
            ]}
          />
        ))}
      </Section>

      <Section title="Switch">
        {(["default", "sm"] as const).map((size) => (
          <Matrix
            key={size}
            title={size === "sm" ? "Small" : "Medium"}
            columns={["Off", "On", "Disabled off", "Disabled on"]}
            rows={[
              {
                label: size === "sm" ? "sm" : "md",
                cells: [
                  <Switch key="off" size={size} aria-label="Off" />,
                  <Switch key="on" size={size} aria-label="On" defaultSelected />,
                  <Switch
                    key="disabled-off"
                    size={size}
                    aria-label="Disabled off"
                    isDisabled
                  />,
                  <Switch
                    key="disabled-on"
                    size={size}
                    aria-label="Disabled on"
                    defaultSelected
                    isDisabled
                  />,
                ],
              },
            ]}
          />
        ))}
      </Section>
    </Page>
  )
}
