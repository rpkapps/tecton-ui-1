import {
  NumberField,
  NumberFieldInput,
  NumberFieldSlider,
  NumberFieldUnit,
} from "@tecton/react/number-field"

const rows = [
  { label: "Opacity", defaultValue: 0.8, min: 0, max: 1, step: 0.01 },
  { label: "Exaggeration", defaultValue: 2, min: 1, max: 10, step: 0.5 },
  { label: "Azimuth", defaultValue: 45, min: 0, max: 360, step: 1, unit: "°" },
]

export default function NumberFieldSliderDemo() {
  return (
    <div className="grid max-w-64 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
      {rows.map(({ label, unit, ...props }) => (
        <NumberField key={label} {...props} className="contents">
          <span className="text-muted-foreground">{label}</span>
          <NumberFieldSlider>
            <NumberFieldInput aria-label={label} />
            {unit && <NumberFieldUnit>{unit}</NumberFieldUnit>}
          </NumberFieldSlider>
        </NumberField>
      ))}
    </div>
  )
}
