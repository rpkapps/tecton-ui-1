export type Surface = {
  id: string
  /** Interpreter code, e.g. "K70". */
  code: string
  name: string
  /** Hex colour of the interpreted surface (from the project's colour table). */
  color: string
  /** Mean depth (TVDSS, metres). */
  depth: number
}

export type SurfacePair = {
  id: string
  label: string
  top: string
  base: string
}

export type HorizonSettings = {
  pairId: string
  volumeId: string
  topDepth: number
  bottomDepth: number
  lineWidth: number
  opacity: number
  smoothing: number
}

export const surfaces: Surface[] = [
  {
    id: "k70",
    code: "K70",
    name: "Spekk FM Top",
    color: "#218585",
    depth: 2525,
  },
  { id: "l70", code: "L70", name: "Are FM Top", color: "#2D7856", depth: 2639 },
  {
    id: "j80",
    code: "J80",
    name: "Melke FM Top",
    color: "#84A138",
    depth: 2481,
  },
  {
    id: "m10",
    code: "M10",
    name: "Garn FM Top",
    color: "#CB8553",
    depth: 2712,
  },
  { id: "m40", code: "M40", name: "Ile FM Top", color: "#8CA7DE", depth: 2790 },
  {
    id: "n20",
    code: "N20",
    name: "Tofte FM Top",
    color: "#C2867A",
    depth: 2874,
  },
]

export const surfacePairs: SurfacePair[] = [
  {
    id: "spekk-are",
    label: "Spekk FM Top → Are FM Top",
    top: "k70",
    base: "l70",
  },
  {
    id: "melke-spekk",
    label: "Melke FM Top → Spekk FM Top",
    top: "j80",
    base: "k70",
  },
  {
    id: "garn-ile",
    label: "Garn FM Top → Ile FM Top",
    top: "m10",
    base: "m40",
  },
  {
    id: "ile-tofte",
    label: "Ile FM Top → Tofte FM Top",
    top: "m40",
    base: "n20",
  },
]

export const volumes = [
  { id: "survey-2", label: "Survey 2" },
  { id: "survey-1", label: "Survey 1 (legacy)" },
  { id: "merged", label: "Merged PSDM" },
]

export const lineWidths = [1, 2, 3, 4, 6, 8]

export const defaultHorizonSettings: HorizonSettings = {
  pairId: "spekk-are",
  volumeId: "survey-2",
  topDepth: 2525,
  bottomDepth: 2639,
  lineWidth: 4,
  opacity: 85,
  smoothing: 20,
}

export function getSurface(id: string): Surface {
  return surfaces.find((surface) => surface.id === id) ?? surfaces[0]
}

export function getPair(id: string): SurfacePair {
  return surfacePairs.find((pair) => pair.id === id) ?? surfacePairs[0]
}
