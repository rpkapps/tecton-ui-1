export type Lithotype = {
  id: string
  name: string
  /** Facies colour from the project template (hex). */
  color: string
  /** Proportion 0–100. */
  density: number
}

export type FaciesTemplate = {
  id: string
  name: string
  color: string
}

export type FaciesSettings = {
  modelName: string
  templateId: string
  inputDataId: string
  targetSurfaceId: string
  volumeId: string
  methodId: string
  seed: string
  realizations: number
  variogram: {
    major: number
    minor: number
    vertical: number
    nugget: number
    sill: number
  }
  options: {
    conditionToWells: boolean
    honourTrends: boolean
    lockSeed: boolean
    exportRealizations: boolean
  }
  lithotypes: Lithotype[]
}

export const faciesTemplates: FaciesTemplate[] = [
  { id: "fluvial", name: "Migrating fluvial channels", color: "#CB8553" },
  { id: "deltaic", name: "Deltaic lobes", color: "#84A138" },
  { id: "turbidite", name: "Turbidite fan", color: "#29A6A6" },
  { id: "carbonate", name: "Carbonate ramp", color: "#8CA7DE" },
]

export const inputData = [
  { id: "rgb-20-50", label: "RGB SpecD 20 – 50 Hz" },
  { id: "rgb-10-30", label: "RGB SpecD 10 – 30 Hz" },
  { id: "ai-inversion", label: "Acoustic impedance (inversion)" },
  { id: "sweetness", label: "Sweetness" },
]

export const targetSurfaces = [
  { id: "spekk-melke", label: "Spekk FM Top, Melke FM Top" },
  { id: "garn-ile", label: "Garn FM Top, Ile FM Top" },
  { id: "ile-tofte", label: "Ile FM Top, Tofte FM Top" },
]

export const volumes = [
  { id: "survey-2", label: "Survey 2" },
  { id: "survey-1", label: "Survey 1 (legacy)" },
]

export const methods = [
  { id: "plurigaussian", label: "Plurigaussian simulation" },
  { id: "sis", label: "Sequential indicator simulation" },
  { id: "mps", label: "Multi-point statistics" },
  { id: "object", label: "Object-based modelling" },
]

export const defaultFaciesSettings: FaciesSettings = {
  modelName: "Facies Model 01",
  templateId: "fluvial",
  inputDataId: "rgb-20-50",
  targetSurfaceId: "spekk-melke",
  volumeId: "survey-2",
  methodId: "plurigaussian",
  seed: "48213",
  realizations: 10,
  variogram: {
    major: 1200,
    minor: 450,
    vertical: 12,
    nugget: 0.1,
    sill: 1,
  },
  options: {
    conditionToWells: true,
    honourTrends: true,
    lockSeed: false,
    exportRealizations: false,
  },
  lithotypes: [
    { id: "floodplain", name: "Floodplain", color: "#8CA7DE", density: 40 },
    { id: "levee", name: "Levee sand", color: "#84A138", density: 20 },
    { id: "channel", name: "Channel sand", color: "#CB8553", density: 25 },
    { id: "crevasse", name: "Crevasse splay sand", color: "#B4A5C8", density: 15 },
  ],
}

export function densityLabel(value: number): string {
  if (value < 15) return "Low"
  if (value < 35) return "Moderate"
  if (value < 60) return "High"
  return "Dominant"
}
