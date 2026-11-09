/**
 * Synthetic inversion results to preview a colour scale against: a 2-D ERT
 * section (resistivity, Ω·m) and a time-lapse difference section (% change).
 * Deterministic, so every variation shows the same picture.
 */

export type Section = {
  /** Cells across (distance) and down (depth). */
  width: number
  height: number
  /** Row-major, top row first. */
  values: Float32Array
  /** Same values, sorted ascending (for percentiles and histograms). */
  sorted: Float32Array
  min: number
  max: number
  /** Physical extent, for axis labels. */
  lengthM: number
  depthM: number
  unit: string
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function blob(
  x: number,
  z: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number
) {
  const d = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2
  return Math.exp(-d)
}

function finish(
  width: number,
  height: number,
  values: Float32Array,
  lengthM: number,
  depthM: number,
  unit: string
): Section {
  const sorted = Float32Array.from(values).sort()
  return {
    width,
    height,
    values,
    sorted,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    lengthM,
    depthM,
    unit,
  }
}

/**
 * Layered ground: dry topsoil, saturated sand, a clay aquitard, weathered then
 * fresh bedrock, with a gravel channel and a conductive leachate plume.
 */
function buildErtSection(width = 192, height = 56): Section {
  const values = new Float32Array(width * height)
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = (i / (width - 1)) * 400 // m
      const z = (j / (height - 1)) * 60 // m
      const clayTop = 22 + 4 * Math.sin(x / 55) + 2 * Math.sin(x / 17)
      const rockTop =
        38 + 7 * Math.sin(x / 90 + 1.2) - 5 * blob(x, 0, 330, 0, 50, 1)

      let logRho = 2.0 // topsoil, 100 Ω·m
      logRho += (1.35 - 2.0) * smoothstep(3, 8, z) // saturated sand ~ 22 Ω·m
      logRho += (0.75 - 1.35) * smoothstep(clayTop - 2, clayTop + 2, z) // clay ~ 6 Ω·m
      logRho += (2.6 - 0.75) * smoothstep(rockTop - 3, rockTop + 3, z) // weathered rock
      logRho += (3.25 - 2.6) * smoothstep(rockTop + 6, rockTop + 14, z) // fresh rock ~ 1.8k

      logRho += 1.05 * blob(x, z, 120, 11, 26, 5) // gravel channel
      logRho -= 1.05 * blob(x, z, 268, 14, 18, 9) * (1 - smoothstep(30, 40, z)) // plume
      logRho -= 0.6 * blob(x, z, 280, 26, 30, 6) // plume spreading on the clay
      logRho += 0.08 * Math.sin(x / 7 + z / 5) * Math.cos(z / 9) // inversion texture

      values[j * width + i] = 10 ** logRho
    }
  }
  return finish(width, height, values, 400, 60, "Ω·m")
}

/** Resistivity change between two surveys, in percent (negative = more conductive). */
function buildChangeSection(width = 192, height = 56): Section {
  const values = new Float32Array(width * height)
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = (i / (width - 1)) * 400
      const z = (j / (height - 1)) * 60
      let change = 0
      change -= 42 * blob(x, z, 250, 18, 40, 11) // brine injection front
      change -= 18 * blob(x, z, 300, 30, 50, 6)
      change += 26 * blob(x, z, 110, 8, 45, 6) // seasonal drying near surface
      change += 9 * blob(x, z, 60, 40, 30, 10)
      change += 3 * Math.sin(x / 9 + z / 4) * Math.cos(z / 7) // inversion noise
      values[j * width + i] = change
    }
  }
  return finish(width, height, values, 400, 60, "%")
}

let ert: Section | undefined
let change: Section | undefined

export function getErtSection() {
  return (ert ??= buildErtSection())
}

export function getChangeSection() {
  return (change ??= buildChangeSection())
}

/** Bin counts over `bins` equal intervals of log10(value) between lo and hi. */
export function logHistogram(
  section: Section,
  lo: number,
  hi: number,
  bins: number
) {
  const counts = new Array<number>(bins).fill(0)
  const a = Math.log10(lo)
  const b = Math.log10(hi)
  for (const v of section.values) {
    const k = Math.floor(((Math.log10(v) - a) / (b - a)) * bins)
    if (k >= 0 && k < bins) counts[k]++
  }
  return counts
}

const iterations = new Map<number, Section>()

/**
 * The ERT section as it looked at an earlier inversion iteration: the same
 * structure with less contrast, closer to the homogeneous starting model.
 */
export function getIterationSection(iteration: number, of = 6): Section {
  const cached = iterations.get(iteration)
  if (cached) return cached
  const final = getErtSection()
  let mean = 0
  for (const v of final.values) mean += Math.log10(v)
  mean /= final.values.length
  const f = Math.min(1, iteration / of) ** 0.7
  const values = final.values.map(
    (v) => 10 ** (mean + (Math.log10(v) - mean) * f)
  )
  const section = finish(
    final.width,
    final.height,
    values,
    final.lengthM,
    final.depthM,
    final.unit
  )
  iterations.set(iteration, section)
  return section
}
