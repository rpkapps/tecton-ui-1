"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import "./background.css"

/**
 * Tecton Background — decorative, non-interactive background effects drawn
 * from oil and gas imagery (seismic traces, contour maps, strata, pipeline
 * grids, …). Every effect is a `Background` layer: absolutely positioned,
 * `pointer-events: none`, `aria-hidden`, and painted with a tone taken from
 * the theme so it reads in light and dark mode alike. Intensity and speed are
 * capped so the effect stays a texture behind real content; reduced motion,
 * `animate={false}`, off-screen and hidden-tab all freeze it on its static
 * frame; print and forced-colours hide it.
 *
 * Effects are drawn at a fixed pixel scale (1px strokes, tiles that repeat),
 * so they look the same in a sidebar tile and behind a full page.
 *
 * Put a `Background` as the first child of a `relative isolate` container and
 * place the content after it.
 */

const backgroundVariants = cva(
  "pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none",
  {
    variants: {
      tone: {
        neutral: "[--bg-tone:var(--foreground)]",
        azure: "[--bg-tone:var(--chart-1)]",
        saffron: "[--bg-tone:var(--chart-2)]",
        lime: "[--bg-tone:var(--chart-3)]",
        blue: "[--bg-tone:var(--chart-4)]",
        primary: "[--bg-tone:var(--primary)]",
      },
      intensity: {
        low: "[--bg-alpha:0.12]",
        medium: "[--bg-alpha:0.2]",
        high: "[--bg-alpha:0.32]",
      },
      speed: {
        slow: "[--bg-duration:60s]",
        normal: "[--bg-duration:36s]",
        fast: "[--bg-duration:18s]",
      },
    },
    defaultVariants: {
      tone: "neutral",
      intensity: "medium",
      speed: "normal",
    },
  }
)

type BackgroundProps = React.ComponentProps<"div"> &
  VariantProps<typeof backgroundVariants> & {
    /** Play the effect's motion. Reduced motion and off-screen always pause it. */
    animate?: boolean
  }

/**
 * Pauses the effect while it is off screen or the tab is hidden, so the
 * animation costs nothing when nobody can see it.
 */
function useVisibilityPause(ref: React.RefObject<HTMLDivElement | null>) {
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    let visible = true
    let tabVisible = document.visibilityState !== "hidden"
    const update = () => setPaused(!(visible && tabVisible))
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(node)
    const onVisibility = () => {
      tabVisible = document.visibilityState !== "hidden"
      update()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [ref])
  return paused
}

function Background({
  className,
  tone = "neutral",
  intensity = "medium",
  speed = "normal",
  animate = true,
  ...props
}: BackgroundProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const paused = useVisibilityPause(ref)
  return (
    <div
      ref={ref}
      aria-hidden="true"
      role="presentation"
      data-slot="background"
      data-tone={tone}
      data-intensity={intensity}
      data-speed={speed}
      data-animate={animate}
      data-paused={paused ? "" : undefined}
      className={cn(backgroundVariants({ tone, intensity, speed }), className)}
      {...props}
    />
  )
}

/* Deterministic pseudo-random so the server and the client draw the same
   paths, and the same effect always looks the same. */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

/**
 * Tile size of the repeating patterns, in CSS pixels. Large enough that a
 * repeat only ever shows on screens wider than 2400px or taller than 1200px.
 */
const TILE_W = 2400
const TILE_H = 1200

/**
 * A full-size SVG whose content is a repeating pixel-scale pattern. `children`
 * is the tile; the group around the filled rect is what the effects animate
 * (translating it by a whole tile is seamless). The rect overshoots by one
 * tile on every side to leave room for that motion.
 */
function PatternSvg({
  id,
  width = TILE_W,
  height = TILE_H,
  style,
  children,
}: {
  id: string
  width?: number
  height?: number
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 size-full"
      style={
        {
          "--bg-tile-w": `${width}px`,
          "--bg-tile-h": `${height}px`,
        } as React.CSSProperties
      }
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          {children}
        </pattern>
      </defs>
      <g style={style}>
        <rect
          x={-width}
          y={-height}
          width={`calc(100% + ${2 * width}px)`}
          height={`calc(100% + ${2 * height}px)`}
          fill={`url(#${id})`}
        />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
 * 1. Seismic — a seismogram record scrolling slowly to the left.
 * ------------------------------------------------------------------------- */

function seismicTrace(random: () => number, y: number, width: number) {
  const points: string[] = [`M0 ${y}`]
  const step = 8
  let phase = random() * Math.PI * 2
  const bursts = Array.from({ length: 6 }, () => ({
    at: random() * width,
    size: 100 + random() * 200,
    amp: 3 + random() * 6,
  }))
  for (let x = step; x <= width; x += step) {
    let amp = 1
    for (const burst of bursts) {
      const d = (x - burst.at) / burst.size
      amp += burst.amp * Math.exp(-d * d * 4)
    }
    // Same start and end so the tile joins seamlessly.
    const edge = Math.min(1, x / 60, (width - x) / 60)
    const dy = Math.sin(x / 7 + phase) * amp * edge
    points.push(`L${x} ${(y + dy).toFixed(1)}`)
    if (x % 120 === 0) phase += (random() - 0.5) * 0.6
  }
  return points.join(" ")
}

function SeismicBackground({ className, ...props }: BackgroundProps) {
  const id = React.useId()
  const random = seeded(7)
  const spacing = 32
  const traces = Array.from({ length: TILE_H / spacing }, (_, i) =>
    seismicTrace(random, spacing / 2 + i * spacing, TILE_W)
  )
  return (
    <Background data-effect="seismic" className={className} {...props}>
      <PatternSvg
        id={id}
        style={{
          animation:
            "tecton-bg-drift-x calc(var(--bg-duration) * 2) linear infinite",
        }}
      >
        <g fill="none" stroke="var(--bg-ink)" strokeWidth="1">
          {traces.map((d, i) => (
            <path key={i} d={d} strokeOpacity={i % 3 === 0 ? 1 : 0.45} />
          ))}
        </g>
      </PatternSvg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 2. Contour — a continuous structure map: a periodic height field sampled on
 *    a grid, isolines extracted with marching squares and chained into long
 *    paths, coloured by elevation, over stepped flat tints (the region above
 *    each level filled with that level's colour, stacked). The field is
 *    4K-sized and drawn once.
 * ------------------------------------------------------------------------- */

const CONTOUR_W = 3840
const CONTOUR_H = 2160
const CONTOUR_CELL = 40
const CONTOUR_LEVELS = 14
/** Levels below this are drawn as lines only, so the ground stays neutral. */
const CONTOUR_FILL_FROM = 5
const CONTOUR_GRID = 120

/**
 * Elevation ramp of the contour map, deep to high: blue, azure, lime,
 * saffron. Each level mixes the two nearest stops so the colour runs smoothly
 * upwards; the stops are chart accents, so both modes are covered.
 */
const CONTOUR_RAMP = [
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-2)",
]

function rampColor(t: number) {
  const pos = Math.min(Math.max(t, 0), 1) * (CONTOUR_RAMP.length - 1)
  const i = Math.min(Math.floor(pos), CONTOUR_RAMP.length - 2)
  const f = Math.round((pos - i) * 100)
  return `color-mix(in oklch, ${CONTOUR_RAMP[i]}, ${CONTOUR_RAMP[i + 1]} ${f}%)`
}

/**
 * Height field: gentle regional waves (whole wavelengths, so the field wraps)
 * plus anticlines and troughs as Gaussian bumps measured with wrapped
 * distances. Returns the sampled grid with one extra column and row so the
 * last cells close onto the first.
 */
type FieldOptions = {
  w?: number
  h?: number
  cell?: number
  /** Number of anticlines and troughs, and their size range in px. */
  bumps?: number
  bumpSize?: readonly [number, number]
  waveAmp?: number
}

function contourField(random: () => number, options: FieldOptions = {}) {
  const {
    w = CONTOUR_W,
    h = CONTOUR_H,
    cell = CONTOUR_CELL,
    bumps: bumpCount = 36,
    bumpSize = [120, 440],
    waveAmp = 0.4,
  } = options
  const cols = w / cell
  const rows = h / cell
  const waves = Array.from({ length: 5 }, () => ({
    kx: (1 + Math.round(random() * 3)) * (random() < 0.5 ? -1 : 1),
    ky: (1 + Math.round(random() * 3)) * (random() < 0.5 ? -1 : 1),
    amp: waveAmp * (0.6 + random() * 0.8),
    phase: random() * Math.PI * 2,
  }))
  const bumps = Array.from({ length: bumpCount }, () => ({
    x: random() * w,
    y: random() * h,
    sx: bumpSize[0] + random() * (bumpSize[1] - bumpSize[0]),
    sy: (bumpSize[0] + random() * (bumpSize[1] - bumpSize[0])) * 0.8,
    amp: (random() < 0.65 ? 1 : -1) * (0.6 + random() * 1.2),
  }))
  const wrap = (d: number, size: number) => {
    const m = Math.abs(d) % size
    return Math.min(m, size - m)
  }
  const values = new Float64Array((cols + 1) * (rows + 1))
  let min = Infinity
  let max = -Infinity
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = i * cell
      const y = j * cell
      let v = 0
      for (const wave of waves) {
        v +=
          wave.amp *
          Math.sin(
            (2 * Math.PI * (wave.kx * x)) / w +
              (2 * Math.PI * (wave.ky * y)) / h +
              wave.phase
          )
      }
      for (const b of bumps) {
        const dx = wrap(x - b.x, w) / b.sx
        const dy = wrap(y - b.y, h) / b.sy
        v += b.amp * Math.exp(-(dx * dx + dy * dy))
      }
      values[j * (cols + 1) + i] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  return { values, cols, rows, cell, w, h, min, max, bumps }
}

type Field = ReturnType<typeof contourField>

/**
 * A copy of the field where a node above the level with no neighbour above
 * it is pushed below: such a node draws as a 40px speck, not a structure.
 */
function withoutSpecks(field: Field, level: number): Field {
  const { values, cols, rows } = field
  const out = new Float64Array(values)
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const n = j * (cols + 1) + i
      if (values[n] <= level) continue
      let alone = true
      for (let dj = -1; dj <= 1 && alone; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue
          const ii = i + di
          const jj = j + dj
          if (ii < 0 || jj < 0 || ii > cols || jj > rows) continue
          if (values[jj * (cols + 1) + ii] > level) {
            alone = false
            break
          }
        }
      }
      if (alone) out[n] = level - 1e-6
    }
  }
  return { ...field, values: out }
}

/**
 * Marching squares for one level: the crossing segments of every cell, then
 * chained end to end into as few polylines as possible.
 */
function isolines(field: Field, level: number) {
  const { values, cols, rows, cell } = field
  const at = (i: number, j: number) => values[j * (cols + 1) + i]
  const key = (x: number, y: number) =>
    `${Math.round(x * 4)},${Math.round(y * 4)}`
  const segments: [number, number, number, number][] = []
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = at(i, j)
      const tr = at(i + 1, j)
      const br = at(i + 1, j + 1)
      const bl = at(i, j + 1)
      const idx =
        (tl > level ? 8 : 0) |
        (tr > level ? 4 : 0) |
        (br > level ? 2 : 0) |
        (bl > level ? 1 : 0)
      if (idx === 0 || idx === 15) continue
      const x0 = i * cell
      const y0 = j * cell
      const lerp = (a: number, b: number) => (level - a) / (b - a)
      const top = [x0 + lerp(tl, tr) * cell, y0] as const
      const right = [x0 + cell, y0 + lerp(tr, br) * cell] as const
      const bottom = [x0 + lerp(bl, br) * cell, y0 + cell] as const
      const left = [x0, y0 + lerp(tl, bl) * cell] as const
      const push = (
        a: readonly [number, number],
        b: readonly [number, number]
      ) => segments.push([a[0], a[1], b[0], b[1]])
      switch (idx) {
        case 1:
        case 14:
          push(left, bottom)
          break
        case 2:
        case 13:
          push(bottom, right)
          break
        case 3:
        case 12:
          push(left, right)
          break
        case 4:
        case 11:
          push(top, right)
          break
        case 5:
          push(top, left)
          push(bottom, right)
          break
        case 6:
        case 9:
          push(top, bottom)
          break
        case 7:
        case 8:
          push(top, left)
          break
        case 10:
          push(top, right)
          push(left, bottom)
          break
      }
    }
  }
  // Chain: every endpoint knows which segments touch it.
  const ends = new Map<string, number[]>()
  segments.forEach(([ax, ay, bx, by], n) => {
    for (const k of [key(ax, ay), key(bx, by)]) {
      const list = ends.get(k)
      if (list) list.push(n)
      else ends.set(k, [n])
    }
  })
  const used = new Uint8Array(segments.length)
  const paths: string[] = []
  const walk = (start: number) => {
    const points: [number, number][] = []
    let [ax, ay, bx, by] = segments[start]
    used[start] = 1
    points.push([ax, ay], [bx, by])
    let x = bx
    let y = by
    for (;;) {
      const next = (ends.get(key(x, y)) ?? []).find((n) => !used[n])
      if (next === undefined) break
      used[next] = 1
      ;[ax, ay, bx, by] = segments[next]
      if (key(ax, ay) === key(x, y)) {
        x = bx
        y = by
      } else {
        x = ax
        y = ay
      }
      points.push([x, y])
    }
    return points
  }
  for (let n = 0; n < segments.length; n++) {
    if (used[n]) continue
    const forward = walk(n)
    // Extend backwards from the first point too, so open lines are whole.
    const [sx, sy] = forward[0]
    const backStart = (ends.get(key(sx, sy)) ?? []).find((m) => !used[m])
    const points =
      backStart === undefined
        ? forward
        : [...walk(backStart).reverse(), ...forward]
    paths.push(
      points
        .map(
          ([x, y], i) =>
            `${i === 0 ? "M" : "L"}${Math.round(x)} ${Math.round(y)}`
        )
        .join("")
    )
  }
  return paths.join("")
}

/**
 * The region above a level as one path: rows of fully-above cells merged into
 * rects, boundary cells as the marching-squares polygon of their above-level
 * part. Drawn with `crispEdges` so the shared edges never show as seams.
 */
function filledAbove(field: Field, level: number) {
  const { values, cols, rows, cell } = field
  const at = (i: number, j: number) => values[j * (cols + 1) + i]
  const out: string[] = []
  const pt = (x: number, y: number) => `${Math.round(x)} ${Math.round(y)}`
  for (let j = 0; j < rows; j++) {
    let run = -1
    const flush = (end: number) => {
      if (run < 0) return
      out.push(
        `M${pt(run * cell, j * cell)}h${(end - run) * cell}v${cell}h${-(end - run) * cell}z`
      )
      run = -1
    }
    for (let i = 0; i < cols; i++) {
      const corners = [
        [i, j, at(i, j)],
        [i + 1, j, at(i + 1, j)],
        [i + 1, j + 1, at(i + 1, j + 1)],
        [i, j + 1, at(i, j + 1)],
      ] as const
      const above = corners.map(([, , v]) => v > level)
      const count = above.filter(Boolean).length
      if (count === 4) {
        if (run < 0) run = i
        continue
      }
      flush(i)
      if (count === 0) continue
      const poly: string[] = []
      for (let c = 0; c < 4; c++) {
        const [cx, cy, cv] = corners[c]
        const [nx, ny, nv] = corners[(c + 1) % 4]
        if (above[c]) poly.push(pt(cx * cell, cy * cell))
        if (above[c] !== above[(c + 1) % 4]) {
          const t = (level - cv) / (nv - cv)
          poly.push(
            pt((cx + (nx - cx) * t) * cell, (cy + (ny - cy) * t) * cell)
          )
        }
      }
      out.push(`M${poly.join("L")}z`)
    }
    flush(cols)
  }
  return out.join("")
}

function ContourBackground({
  className,
  palette = "map",
  grid = false,
  ...props
}: BackgroundProps & {
  /** `map` colours the isolines by elevation, `tone` draws them in the single tone. */
  palette?: "map" | "tone"
  /** Draw a survey grid under the isolines. */
  grid?: boolean
}) {
  const field = React.useMemo(() => contourField(seeded(11)), [])
  const levels = React.useMemo(
    () =>
      Array.from({ length: CONTOUR_LEVELS }, (_, i) => {
        const t = (i + 0.5) / CONTOUR_LEVELS
        const level = field.min + (field.max - field.min) * t
        const clean = withoutSpecks(field, level)
        // The ramp runs over the filled levels; the lower lines stay blue.
        const ramp = Math.max(
          0,
          (i - CONTOUR_FILL_FROM) / (CONTOUR_LEVELS - 1 - CONTOUR_FILL_FROM)
        )
        return {
          d: isolines(clean, level),
          fill: i < CONTOUR_FILL_FROM ? "" : filledAbove(clean, level),
          color: palette === "map" ? rampColor(ramp) : "var(--bg-tone)",
          index: i % 4 === 1,
        }
      }),
    [field, palette]
  )
  return (
    <Background
      data-effect="contour"
      data-palette={palette}
      data-grid={grid || undefined}
      className={className}
      {...props}
    >
      {/* Plain vector paths, not a pattern: a pattern is rasterised and goes
          soft when the wander moves it by a fraction of a pixel. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
      >
        <g
          style={{
            animation:
              "tecton-bg-wander var(--bg-duration) ease-in-out infinite",
          }}
        >
          {/* Stepped tints: the region above each level in that level's
              colour, stacked, so the bands climb the ramp like a printed map. */}
          <g shapeRendering="crispEdges">
            {levels.map(({ fill, color }, i) => (
              <path
                key={i}
                d={fill}
                fill={color}
                fillOpacity="calc(var(--bg-alpha) * 0.16)"
              />
            ))}
          </g>
          {grid && (
            <g stroke="var(--bg-ink-soft)" strokeWidth="1">
              {Array.from({ length: CONTOUR_W / CONTOUR_GRID }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * CONTOUR_GRID}
                  x2={i * CONTOUR_GRID}
                  y1="0"
                  y2={CONTOUR_H}
                  strokeOpacity={i % 5 === 0 ? 1 : 0.5}
                />
              ))}
              {Array.from({ length: CONTOUR_H / CONTOUR_GRID }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  x2={CONTOUR_W}
                  y1={i * CONTOUR_GRID}
                  y2={i * CONTOUR_GRID}
                  strokeOpacity={i % 5 === 0 ? 1 : 0.5}
                />
              ))}
            </g>
          )}
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            {levels.map(({ d, color, index }, i) => (
              <path
                key={i}
                d={d}
                stroke={color}
                strokeOpacity={`calc(var(--bg-alpha) * ${index ? 1.6 : 1})`}
                strokeWidth={index ? 1.5 : 1}
              />
            ))}
          </g>
        </g>
      </svg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 3. Strata — a geological cross-section: undulating bedding planes with
 *    alternating tints, panning very slowly along the section.
 * ------------------------------------------------------------------------- */

/** A bedding plane across the tile; whole wavelengths, so the tile repeats. */
function beddingPlane(random: () => number, amplitude: number) {
  const waves = [1, 2, 3].map((k) => ({
    k,
    amp: (amplitude / k) * (0.5 + random()),
    phase: random() * Math.PI * 2,
  }))
  return (x: number) =>
    waves.reduce(
      (sum, w) =>
        sum + w.amp * Math.sin((2 * Math.PI * w.k * x) / TILE_W + w.phase),
      0
    )
}

function StrataBackground({ className, ...props }: BackgroundProps) {
  const id = React.useId()
  const random = seeded(3)
  const step = 12
  const xs = Array.from({ length: TILE_W / step + 1 }, (_, i) => i * step)
  // Layer boundaries from the top of the tile to the bottom; the last plane
  // reuses the first one's wave so the tile also repeats vertically.
  const first = beddingPlane(random, 14)
  const planes: { y: number; wave: (x: number) => number }[] = [
    { y: 0, wave: first },
  ]
  let y = 0
  while (y < TILE_H - 70) {
    y += 26 + random() * 44
    planes.push({ y, wave: beddingPlane(random, 8 + random() * 12) })
  }
  planes.push({ y: TILE_H, wave: first })
  const line = (plane: (typeof planes)[number]) =>
    xs
      .map(
        (x, i) =>
          `${i === 0 ? "M" : "L"}${x} ${(plane.y + plane.wave(x)).toFixed(1)}`
      )
      .join(" ")
  const layers = planes.slice(0, -1).map((top, i) => {
    const bottom = planes[i + 1]
    const down = xs.map((x) => `L${x} ${(top.y + top.wave(x)).toFixed(1)}`)
    const back = [...xs]
      .reverse()
      .map((x) => `L${x} ${(bottom.y + bottom.wave(x)).toFixed(1)}`)
    return {
      d: `M0 ${(top.y + top.wave(0)).toFixed(1)} ${down.join(" ")} ${back.join(" ")} Z`,
      tint: i % 3,
    }
  })
  return (
    <Background data-effect="strata" className={className} {...props}>
      <PatternSvg
        id={id}
        style={{
          animation:
            "tecton-bg-drift-x calc(var(--bg-duration) * 5) linear infinite",
        }}
      >
        {layers.map(({ d, tint }, i) => (
          <path
            key={`layer-${i}`}
            d={d}
            fill={
              tint === 0
                ? "var(--bg-ink-soft)"
                : tint === 1
                  ? "var(--bg-ink)"
                  : "none"
            }
            fillOpacity={tint === 1 ? 0.5 : 1}
          />
        ))}
        <g fill="none" stroke="var(--bg-ink)" strokeWidth="1">
          {planes.slice(0, -1).map((plane, i) => (
            <path
              key={`plane-${i}`}
              d={line(plane)}
              strokeOpacity={i % 2 ? 0.6 : 1}
            />
          ))}
        </g>
      </PatternSvg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 4. Pipeline grid — orthogonal lines with nodes lighting up; optionally
 *    reactive to the pointer.
 * ------------------------------------------------------------------------- */

const GRID = 48

function PipelineGridBackground({
  className,
  interactive = false,
  ...props
}: BackgroundProps & {
  /** Reveal the grid around the pointer as it moves over the parent. */
  interactive?: boolean
}) {
  const random = seeded(19)
  const nodes = Array.from({ length: 40 }, () => ({
    x: Math.round(random() * 40) * GRID,
    y: Math.round(random() * 22) * GRID,
    delay: -random() * 30,
    duration: 4 + random() * 6,
  }))
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!interactive) return
    const node = ref.current
    // The background layer ignores the pointer, so listen on its container.
    const parent = node?.closest("[data-slot=background]")?.parentElement
    if (!node || !parent) return
    const onMove = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      node.style.setProperty("--bg-x", `${event.clientX - rect.left}px`)
      node.style.setProperty("--bg-y", `${event.clientY - rect.top}px`)
      node.dataset.hover = ""
    }
    const onLeave = () => {
      delete node.dataset.hover
    }
    parent.addEventListener("pointermove", onMove)
    parent.addEventListener("pointerleave", onLeave)
    return () => {
      parent.removeEventListener("pointermove", onMove)
      parent.removeEventListener("pointerleave", onLeave)
    }
  }, [interactive])
  const lines = (ink: string) =>
    `linear-gradient(to right, ${ink} 1px, transparent 1px), linear-gradient(to bottom, ${ink} 1px, transparent 1px)`
  return (
    <Background data-effect="pipeline-grid" className={className} {...props}>
      <div
        ref={ref}
        className="absolute inset-0"
        style={{
          backgroundImage: lines("var(--bg-ink)"),
          backgroundSize: `${GRID}px ${GRID}px`,
          backgroundPosition: "-1px -1px",
        }}
      >
        {interactive && (
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 [[data-hover]>&]:opacity-100"
            style={{
              backgroundImage: lines("var(--bg-ink-strong)"),
              backgroundSize: `${GRID}px ${GRID}px`,
              backgroundPosition: "-1px -1px",
              maskImage:
                "radial-gradient(180px circle at var(--bg-x, -999px) var(--bg-y, -999px), black, transparent)",
            }}
          />
        )}
        {nodes.map((node, i) => (
          <span
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{
              left: node.x,
              top: node.y,
              translate: "-50% -50%",
              background: "var(--bg-ink-strong)",
              animation: `tecton-bg-pulse ${node.duration}s ease-in-out infinite`,
              animationDelay: `${node.delay}s`,
            }}
          />
        ))}
      </div>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 5. Flow — a process-flow schematic: orthogonal pipe runs with rounded
 *    elbows and junction nodes, fluid pulses moving through them. One large
 *    network rather than a tile, so nothing repeats on a full screen.
 * ------------------------------------------------------------------------- */

const FLOW_GRID = 48
const FLOW_COLS = 80
const FLOW_ROWS = 40
const FLOW_ELBOW = 12
const FLOW_PULSE = 240

type Dir = readonly [number, number]
const DIRS: Dir[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/**
 * A pipe run is a random walk on the grid that keeps going straight most of
 * the time and never doubles back; the corners are rounded with arcs.
 */
function pipeRun(random: () => number) {
  let x = 1 + Math.floor(random() * (FLOW_COLS - 2))
  let y = 1 + Math.floor(random() * (FLOW_ROWS - 2))
  let dir = DIRS[Math.floor(random() * 4)]
  const points: [number, number][] = [[x, y]]
  const length = 6 + Math.floor(random() * 12)
  for (let i = 0; i < length; i++) {
    if (random() < 0.3) {
      const turns = DIRS.filter(
        (d) => d[0] !== dir[0] || d[1] !== dir[1]
      ).filter((d) => d[0] !== -dir[0] || d[1] !== -dir[1])
      dir = turns[Math.floor(random() * turns.length)]
    }
    const run = 1 + Math.floor(random() * 3)
    x = Math.min(FLOW_COLS - 1, Math.max(1, x + dir[0] * run))
    y = Math.min(FLOW_ROWS - 1, Math.max(1, y + dir[1] * run))
    const last = points[points.length - 1]
    if (last[0] !== x || last[1] !== y) points.push([x, y])
  }
  return points
}

/** Path data for a polyline on the grid with rounded corners. */
function pipePath(points: [number, number][]) {
  const px = points.map(([x, y]) => [x * FLOW_GRID, y * FLOW_GRID] as const)
  let d = `M${px[0][0]} ${px[0][1]}`
  for (let i = 1; i < px.length; i++) {
    const [x, y] = px[i]
    const [px0, py0] = px[i - 1]
    if (i === px.length - 1) {
      d += ` L${x} ${y}`
      continue
    }
    const next = px[i + 1]
    const inDir = [Math.sign(x - px0), Math.sign(y - py0)]
    const outDir = [Math.sign(next[0] - x), Math.sign(next[1] - y)]
    if (inDir[0] === outDir[0] && inDir[1] === outDir[1]) {
      d += ` L${x} ${y}`
      continue
    }
    // Stop short of the corner, arc into the new direction.
    const ax = x - inDir[0] * FLOW_ELBOW
    const ay = y - inDir[1] * FLOW_ELBOW
    const bx = x + outDir[0] * FLOW_ELBOW
    const by = y + outDir[1] * FLOW_ELBOW
    const cross = inDir[0] * outDir[1] - inDir[1] * outDir[0]
    d += ` L${ax} ${ay} A${FLOW_ELBOW} ${FLOW_ELBOW} 0 0 ${cross > 0 ? 1 : 0} ${bx} ${by}`
  }
  return d
}

function FlowBackground({ className, ...props }: BackgroundProps) {
  const random = seeded(23)
  const runs = Array.from({ length: 150 }, () => {
    const points = pipeRun(random)
    return {
      d: pipePath(points),
      start: points[0],
      end: points[points.length - 1],
      pulse: random() < 0.6,
      speed: 0.7 + random() * 0.8,
      delay: -random() * 40,
    }
  })
  const nodes = runs.flatMap((run) => [run.start, run.end])
  return (
    <Background data-effect="flow" className={className} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
        style={{ "--bg-dash": `${FLOW_PULSE}px` } as React.CSSProperties}
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {runs.map((run, i) => (
            <path
              key={`pipe-${i}`}
              d={run.d}
              stroke="var(--bg-ink)"
              strokeWidth="1.5"
            />
          ))}
          {runs
            .filter((run) => run.pulse)
            .map((run, i) => (
              <path
                key={`pulse-${i}`}
                d={run.d}
                stroke="var(--bg-ink-strong)"
                strokeWidth="1.5"
                strokeDasharray={`${FLOW_PULSE * 0.2} ${FLOW_PULSE * 0.8}`}
                style={{
                  animation: `tecton-bg-flow calc(var(--bg-duration) * ${run.speed.toFixed(2)} / 3) linear infinite`,
                  animationDelay: `${run.delay.toFixed(1)}s`,
                }}
              />
            ))}
        </g>
        <g
          fill="var(--background)"
          stroke="var(--bg-ink-strong)"
          strokeWidth="1.5"
        >
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x * FLOW_GRID} cy={y * FLOW_GRID} r="3.5" />
          ))}
        </g>
      </svg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 6. Well log — vertical log traces paging upwards very slowly, as if
 *    scrolling deeper down the log.
 * ------------------------------------------------------------------------- */

function wellLogTrace(random: () => number, x: number, height: number) {
  const points: string[] = [`M${x} 0`]
  let value = 0
  for (let y = 5; y <= height; y += 5) {
    value += (random() - 0.5) * 6
    value *= 0.88
    const spike = random() > 0.985 ? (random() - 0.5) * 18 : 0
    // Return to the axis at the bottom so the tile joins seamlessly.
    const edge = Math.min(1, y / 40, (height - y) / 40)
    points.push(`L${(x + (value + spike) * edge).toFixed(1)} ${y}`)
  }
  return points.join(" ")
}

function WellLogBackground({ className, ...props }: BackgroundProps) {
  const id = React.useId()
  const random = seeded(31)
  const spacing = 120
  const xs = Array.from(
    { length: TILE_W / spacing },
    (_, i) => spacing / 2 + i * spacing
  )
  return (
    <Background data-effect="well-log" className={className} {...props}>
      <PatternSvg
        id={id}
        style={{
          animation:
            "tecton-bg-drift-y calc(var(--bg-duration) * 4) linear infinite reverse",
        }}
      >
        <g fill="none" stroke="var(--bg-ink)" strokeWidth="1">
          {xs.map((x, i) => (
            <React.Fragment key={x}>
              <line
                x1={x}
                x2={x}
                y1="0"
                y2={TILE_H}
                stroke="var(--bg-ink-soft)"
                strokeDasharray="2 6"
              />
              <path
                d={wellLogTrace(random, x, TILE_H)}
                stroke={i % 2 === 0 ? "var(--bg-ink)" : "var(--bg-ink-soft)"}
                strokeWidth={i % 2 === 0 ? 1.2 : 1}
              />
            </React.Fragment>
          ))}
        </g>
      </PatternSvg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 7. Drill — a bit seen from above, turning slowly, centred in the container.
 * ------------------------------------------------------------------------- */

function DrillBackground({ className, ...props }: BackgroundProps) {
  const spokes = 24
  const rings = [40, 90, 150, 220, 300, 400, 520, 660]
  const reach = 900
  return (
    <Background data-effect="drill" className={className} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-1/2 left-1/2 size-[2000px] -translate-1/2"
        viewBox="-1000 -1000 2000 2000"
      >
        <g
          fill="none"
          stroke="var(--bg-ink)"
          strokeWidth="1"
          style={{
            transformOrigin: "0 0",
            animation:
              "tecton-bg-rotate calc(var(--bg-duration) * 6) linear infinite",
          }}
        >
          {rings.map((r, i) => (
            <circle
              key={r}
              r={r}
              strokeOpacity={i % 2 === 0 ? 1 : 0.5}
              strokeDasharray={i % 2 === 0 ? undefined : "4 10"}
            />
          ))}
          {Array.from({ length: spokes }, (_, i) => {
            const a = (i / spokes) * Math.PI * 2
            const inner = i % 3 === 0 ? 40 : 150
            return (
              <line
                key={i}
                x1={Math.cos(a) * inner}
                y1={Math.sin(a) * inner}
                x2={Math.cos(a) * reach}
                y2={Math.sin(a) * reach}
                strokeOpacity={i % 3 === 0 ? 0.9 : 0.35}
              />
            )
          })}
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2
            return (
              <path
                key={i}
                d={`M0 0 A 150 150 0 0 1 ${(Math.cos(a) * 150).toFixed(1)} ${(Math.sin(a) * 150).toFixed(1)}`}
                stroke="var(--bg-ink-strong)"
                strokeWidth="1.5"
              />
            )
          })}
        </g>
      </svg>
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 8. Reservoir cells — a simulation mesh with cells lighting up in turn.
 * ------------------------------------------------------------------------- */

/*
 * Pointy-top hexagons on an integer grid: 38px wide, rows 33px apart. A true
 * regular hexagon of this height is 38.1px wide, and a pattern tile with a
 * fractional size drifts by a fraction of a pixel per repeat, which is what
 * put the lit cells off their mesh; the 0.3% squash is invisible.
 */
const HEX_R = 22
const HEX_W = 38
const HEX_H = 33

function hexPoints(cx: number, cy: number, scale = 1) {
  const hw = (HEX_W / 2) * scale
  const r = HEX_R * scale
  const half = (HEX_R / 2) * scale
  return [
    [cx + hw, cy + half],
    [cx, cy + r],
    [cx - hw, cy + half],
    [cx - hw, cy - half],
    [cx, cy - r],
    [cx + hw, cy - half],
  ] as const
}

function hexPath(cx: number, cy: number) {
  return (
    hexPoints(cx, cy)
      .map(
        ([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
      )
      .join(" ") + " Z"
  )
}

function hexClip(inset: number) {
  return `polygon(${hexPoints(HEX_R, HEX_R, (HEX_R - inset) / HEX_R)
    .map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)
    .join(", ")})`
}

function ReservoirCellsBackground({ className, ...props }: BackgroundProps) {
  const id = React.useId()
  const random = seeded(41)
  // One tile holds two rows (the second offset by half a cell), so it repeats.
  const tileW = HEX_W
  const tileH = HEX_H * 2
  const lit = Array.from({ length: 36 }, () => {
    const row = Math.floor(random() * 24)
    const col = Math.floor(random() * 44)
    return {
      x: col * HEX_W + (row % 2 ? HEX_W / 2 : 0),
      y: row * HEX_H,
      duration: 5 + random() * 7,
      delay: -random() * 30,
    }
  })
  return (
    <Background data-effect="reservoir-cells" className={className} {...props}>
      <PatternSvg id={id} width={tileW} height={tileH}>
        <g fill="none" stroke="var(--bg-ink)" strokeWidth="1">
          <path d={hexPath(0, 0)} />
          <path d={hexPath(tileW, 0)} />
          <path d={hexPath(tileW / 2, HEX_H)} />
          <path d={hexPath(0, tileH)} />
          <path d={hexPath(tileW, tileH)} />
        </g>
      </PatternSvg>
      {lit.map((cell, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: cell.x,
            top: cell.y,
            width: HEX_R * 2,
            height: HEX_R * 2,
            translate: "-50% -50%",
            clipPath: hexClip(1.5),
            background: "var(--bg-ink)",
            animation: `tecton-bg-pulse ${cell.duration}s ease-in-out infinite`,
            animationDelay: `${cell.delay}s`,
          }}
        />
      ))}
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 9. Pressure — soft gradient blobs, the most abstract and the calmest.
 * ------------------------------------------------------------------------- */

function PressureBackground({ className, ...props }: BackgroundProps) {
  const blobs = [
    { left: "5%", top: "-10%", size: "55%", duration: 1, delay: 0 },
    { left: "50%", top: "30%", size: "60%", duration: 1.4, delay: -12 },
    { left: "70%", top: "-25%", size: "45%", duration: 1.2, delay: -25 },
    { left: "20%", top: "55%", size: "50%", duration: 1.7, delay: -40 },
  ]
  return (
    <Background data-effect="pressure" className={className} {...props}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute aspect-square rounded-full"
          style={{
            left: blob.left,
            top: blob.top,
            width: blob.size,
            background:
              "radial-gradient(circle, var(--bg-ink), var(--bg-ink-soft) 45%, transparent 70%)",
            filter: "blur(24px)",
            animation: `tecton-bg-migrate calc(var(--bg-duration) * ${blob.duration}) ease-in-out infinite`,
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 10. Horizon — a ground line with atmospheric layers, almost static.
 * ------------------------------------------------------------------------- */

function HorizonBackground({ className, ...props }: BackgroundProps) {
  return (
    <Background data-effect="horizon" className={className} {...props}>
      <div
        className="absolute inset-x-0 top-0 h-[62%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 30%, var(--bg-ink-soft))",
          animation:
            "tecton-bg-breathe calc(var(--bg-duration) * 1.5) ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-x-0 top-[62%] h-px"
        style={{ background: "var(--bg-ink-strong)" }}
      />
      <div
        className="absolute inset-x-0 top-[62%] bottom-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, var(--bg-ink-soft) 0 1px, transparent 1px 14px), linear-gradient(to bottom, var(--bg-ink), transparent 70%)",
          animation:
            "tecton-bg-breathe calc(var(--bg-duration) * 1.5) ease-in-out infinite",
          animationDelay: "-10s",
        }}
      />
    </Background>
  )
}

/* ---------------------------------------------------------------------------
 * 11. Terrain grid — a wireframe surface in perspective: a wavy plane of
 *     squares receding to a horizon, nodes glowing on the near rows.
 * ------------------------------------------------------------------------- */

const TERRAIN_W = 1600
const TERRAIN_H = 900
const TERRAIN_HORIZON = 300
const TERRAIN_FOCAL = 720
const TERRAIN_EYE = 2

function terrainHeight(x: number, d: number) {
  return (
    0.34 * Math.sin(x * 0.55 + d * 0.4) * Math.cos(d * 0.3) +
    0.2 * Math.sin(x * 1.1 - d * 0.6) +
    0.14 * Math.sin(d * 1.1 + x * 0.2)
  )
}

function terrainProject(x: number, d: number) {
  const z = terrainHeight(x, d)
  return [
    TERRAIN_W / 2 + (x * TERRAIN_FOCAL) / d,
    TERRAIN_HORIZON + ((TERRAIN_EYE - z) * TERRAIN_FOCAL) / d,
  ] as const
}

function TerrainGridBackground({ className, ...props }: BackgroundProps) {
  const id = React.useId()
  const columns = Array.from({ length: 67 }, (_, i) => -9.9 + i * 0.3)
  // Depth rows spaced geometrically so they look evenly spaced on screen.
  const depths = Array.from(
    { length: 44 },
    (_, i) => 2 * Math.pow(22 / 2, i / 43)
  )
  const line = (points: (readonly [number, number])[]) =>
    points
      .map(
        ([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(0)} ${y.toFixed(0)}`
      )
      .join("")
  const rows = depths.map((d) => line(columns.map((x) => terrainProject(x, d))))
  const cols = columns.map((x) => line(depths.map((d) => terrainProject(x, d))))
  const nodes = depths
    .slice(0, 18)
    .flatMap((d, j) =>
      columns
        .filter((_, i) => (i + j) % 4 === 0)
        .map((x) => ({ p: terrainProject(x, d), r: 0.8 + 3.2 / d, d }))
    )
    .filter(
      ({ p }) => p[0] > -40 && p[0] < TERRAIN_W + 40 && p[1] < TERRAIN_H + 40
    )
  return (
    <Background data-effect="terrain-grid" className={className} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${TERRAIN_W} ${TERRAIN_H}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset={TERRAIN_HORIZON / TERRAIN_H}
              stopColor="#fff"
              stopOpacity="0"
            />
            <stop
              offset={(TERRAIN_HORIZON + 160) / TERRAIN_H}
              stopColor="#fff"
              stopOpacity="1"
            />
          </linearGradient>
          <mask id={`${id}-mask`}>
            <rect
              width={TERRAIN_W}
              height={TERRAIN_H}
              fill={`url(#${id}-fade)`}
            />
          </mask>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor="var(--bg-tone)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--bg-tone)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={TERRAIN_W / 2}
          cy={TERRAIN_HORIZON + 20}
          rx="700"
          ry="120"
          fill={`url(#${id}-glow)`}
          style={{ opacity: "calc(var(--bg-alpha) * 0.8)" }}
        />
        <g mask={`url(#${id}-mask)`} fill="none" stroke="var(--bg-ink)">
          {rows.map((d, i) => (
            <path key={`r${i}`} d={d} vectorEffect="non-scaling-stroke" />
          ))}
          {cols.map((d, i) => (
            <path key={`c${i}`} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g fill="var(--bg-ink-strong)">
          {nodes.map(({ p, r, d }, i) => (
            <circle
              key={i}
              cx={p[0].toFixed(0)}
              cy={p[1].toFixed(0)}
              r={r.toFixed(1)}
              style={{
                animation: `tecton-bg-pulse ${(4 + (i % 5)).toFixed(0)}s ease-in-out infinite`,
                animationDelay: `${(-(i * 0.7) % 9).toFixed(1)}s`,
                opacity: d > 6 ? 0.5 : 1,
              }}
            />
          ))}
        </g>
      </svg>
    </Background>
  )
}

/* ------------------------------------------------------------------------- */

const backgroundEffects = {
  seismic: SeismicBackground,
  contour: ContourBackground,
  strata: StrataBackground,
  "pipeline-grid": PipelineGridBackground,
  flow: FlowBackground,
  "well-log": WellLogBackground,
  drill: DrillBackground,
  "reservoir-cells": ReservoirCellsBackground,
  pressure: PressureBackground,
  horizon: HorizonBackground,
  "terrain-grid": TerrainGridBackground,
} as const

type BackgroundEffectName = keyof typeof backgroundEffects

/** Picks an effect by name; handy for a consumer's settings screen. */
function BackgroundEffect({
  effect,
  ...props
}: BackgroundProps & { effect: BackgroundEffectName }) {
  const Effect = backgroundEffects[effect]
  return <Effect {...props} />
}

export {
  Background,
  BackgroundEffect,
  SeismicBackground,
  ContourBackground,
  StrataBackground,
  PipelineGridBackground,
  FlowBackground,
  WellLogBackground,
  DrillBackground,
  ReservoirCellsBackground,
  PressureBackground,
  HorizonBackground,
  TerrainGridBackground,
  backgroundEffects,
  backgroundVariants,
  type BackgroundProps,
  type BackgroundEffectName,
}
