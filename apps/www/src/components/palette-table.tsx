"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"
import { Button as PressableButton } from "react-aria-components"
import { toast } from "sonner"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

import map from "../../../../packages/tecton-react/tokens/tecton.map.json"
import theme from "../../../../packages/tecton-react/registry/theme.json"

const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

const prefix = `${map.palette.prefix}-`
const light = theme.cssVars.light as Record<string, string>
const dark = theme.cssVars.dark as Record<string, string>

const families = map.palette.families.map(kebab)
const shades = map.palette.shades.map(kebab)
/** Step numbers of the first family, in file order (all families share them). */
const steps = Object.keys(light)
  .filter((k) => k.startsWith(`${prefix}${families[0]}-`))
  .map((k) => k.slice(prefix.length + families[0].length + 1))

type CopyMode = "class" | "variable" | "value"

const copyModes: { id: CopyMode; label: string }[] = [
  { id: "class", label: "Tailwind class" },
  { id: "variable", label: "CSS variable" },
  { id: "value", label: "Colour" },
]

/** What a swatch puts on the clipboard for each mode. */
function copyText(name: string, mode: CopyMode, isDark: boolean) {
  const key = `${prefix}${name}`
  if (mode === "class") return `bg-${name}`
  if (mode === "variable") return `var(--${key})`
  return isDark ? dark[key] : light[key]
}

function Swatch({
  name,
  mode,
  copied,
  onCopy,
  className,
}: {
  name: string
  mode: CopyMode
  copied: boolean
  onCopy: (name: string) => void
  className?: string
}) {
  const key = `${prefix}${name}`
  const modeLabel = copyModes.find((m) => m.id === mode)?.label.toLowerCase()
  return (
    // React Aria's Button drops `title`; the tooltip lives on the wrapper
    <div
      title={`bg-${name}\nvar(--${key})\nlight ${light[key]}\ndark ${dark[key]}\n\nclick to copy the ${modeLabel}`}
      className={cn("size-5", className)}
    >
      <PressableButton
        aria-label={`Copy ${copyText(name, mode, false)} (${name}: ${light[key]} light, ${dark[key]} dark)`}
        onPress={() => onCopy(name)}
        className={cn(
          "flex size-5 cursor-pointer items-center justify-center rounded-xs outline-none",
          "transition-transform hover:relative hover:z-10 hover:scale-150 hover:shadow-md",
          "focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
        )}
        style={{ background: `var(--${key})` }}
      >
        {copied && (
          <CheckIcon
            className="size-3 text-white mix-blend-difference"
            aria-hidden
          />
        )}
      </PressableButton>
    </div>
  )
}

/**
 * The Tecton palette exposed to Tailwind: one row per family, one cell per
 * contrast step, painted with the live `--tecton-palette-*` variable so the
 * table follows the site's colour mode. Click a cell to copy the Tailwind
 * class, the CSS variable or the current mode's colour value; hover for all
 * of them. Generated from tokens/tecton.map.json + registry/theme.json.
 * `feedback` announces a copy inline (default) or as a sonner toast.
 */
export function PaletteTable({
  className,
  feedback = "inline",
}: {
  className?: string
  feedback?: "inline" | "toast"
}) {
  const [mode, setMode] = React.useState<CopyMode>("class")
  const [copied, setCopied] = React.useState<{
    name: string
    text: string
  } | null>(null)
  const { copyToClipboard } = useCopyToClipboard({ timeout: 0 })
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const onCopy = async (name: string) => {
    const isDark = document.documentElement.classList.contains("dark")
    const text = copyText(name, mode, isDark)
    if (!(await copyToClipboard(text))) return
    if (feedback === "toast") toast(`Copied ${text}`)
    setCopied({ name, text })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div data-not-typeset className={cn("my-6 flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Click a colour to copy its
        </span>
        <ToggleGroup
          aria-label="What to copy"
          selectionMode="single"
          size="sm"
          selectedKeys={[mode]}
          disallowEmptySelection
          onSelectionChange={(keys) =>
            setMode(String([...keys][0]) as CopyMode)
          }
        >
          {copyModes.map((m) => (
            <ToggleGroupItem key={m.id} id={m.id}>
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {feedback === "inline" && (
          <span
            role="status"
            aria-live="polite"
            className="min-h-4 font-mono text-xs text-success"
          >
            {copied ? `Copied ${copied.text}` : ""}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pr-1 text-xs font-medium">family</th>
              {steps.map((step) => (
                <th
                  key={step}
                  className="w-5 text-center font-mono text-[8px] font-normal"
                >
                  {step}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {families.map((family) => (
              <tr key={family}>
                <td className="pr-1 font-mono text-[11px] whitespace-nowrap">
                  {family}
                </td>
                {steps.map((step) => (
                  <td key={step} className="p-0">
                    <Swatch
                      name={`${family}-${step}`}
                      mode={mode}
                      copied={copied?.name === `${family}-${step}`}
                      onCopy={onCopy}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="pt-2 pr-1 font-mono text-[11px] whitespace-nowrap">
                shades
              </td>
              {shades.map((shade) => (
                <td key={shade} className="p-0 pt-2">
                  <Swatch
                    name={shade}
                    mode={mode}
                    copied={copied?.name === shade}
                    onCopy={onCopy}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
