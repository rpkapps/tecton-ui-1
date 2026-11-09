/**
 * Perceptual measures of the presets, in OKLab: how lightness runs along a
 * scale (what survives greyscale printing and reads as "more"), and how far
 * apart two colours look (ΔE).
 */
import {
  colormaps,
  evenStops,
  getColormap,
  sampleStops,
  type RGB,
} from "./colormaps"

function linear(c: number) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** sRGB (0–255) to OKLab [L, a, b], L in 0–1. */
export function oklab([r8, g8, b8]: RGB): [number, number, number] {
  const r = linear(r8)
  const g = linear(g8)
  const b = linear(b8)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** Perceived colour difference (OKLab Euclidean distance, ×100). */
export function deltaE(a: RGB, b: RGB) {
  const [l1, a1, b1] = oklab(a)
  const [l2, a2, b2] = oklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100
}

export type Profile = {
  /** OKLab lightness at evenly spaced positions along the scale. */
  lightness: number[]
  /** Lightness only rises (or only falls) from one end to the other. */
  monotonic: boolean
  /** 0–1: how evenly lightness changes per step (1 = a straight line). */
  uniformity: number
  /** Lightness range covered, 0–1. */
  range: number
}

const cache = new Map<string, Profile>()

export function profile(id: string, samples = 64): Profile {
  const cached = cache.get(id)
  if (cached) return cached
  const stops = evenStops(getColormap(id).stops)
  const lightness = Array.from(
    { length: samples },
    (_, i) => oklab(sampleStops(stops, i / (samples - 1)))[0]
  )
  const steps = lightness.slice(1).map((l, i) => l - lightness[i])
  const rising = steps.every((d) => d >= -0.004)
  const falling = steps.every((d) => d <= 0.004)
  const abs = steps.map(Math.abs)
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length
  const sd = Math.sqrt(
    abs.reduce((a, b) => a + (b - mean) ** 2, 0) / abs.length
  )
  const result: Profile = {
    lightness,
    monotonic: rising || falling,
    uniformity: Math.max(0, 1 - sd / (mean || 1)),
    range: Math.max(...lightness) - Math.min(...lightness),
  }
  cache.set(id, result)
  return result
}

export function allProfiles() {
  return colormaps.map((map) => ({ map, profile: profile(map.id) }))
}
