/// <reference types="node" />
/**
 * Screenshot comparison against the Tecton Storybook captures.
 *
 * Renders every state matrix registered in src/compare/matrices.ts at
 * /compare/<key> (dark mode, 1600×1000 @2x), saves the capture to
 * e2e/compare/<key>.png and writes e2e/compare/index.html — a contact sheet
 * that places each capture next to its reference PNG from tecton-screenshots/
 * for visual review. For the `tokens` matrix it also measures the rendered
 * swatch colours and compares them with the values in tecton-tokens.css
 * (they must match exactly: the dark theme is a 1:1 token mapping).
 *
 * Usage: pnpm --filter www compare   (starts `vite preview` on 4173 or
 *        COMPARE_PORT, needs a prior build)
 *        BASE_URL=http://localhost:3000 bun run e2e/compare.spec.ts  (against a dev server)
 */
import { spawn } from "node:child_process"
import type { ChildProcess } from "node:child_process"
import { createRequire } from "node:module"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WWW = path.resolve(HERE, "..")
const REPO = path.resolve(WWW, "../..")
const OUT = path.join(HERE, "compare")
const SHOTS = path.join(REPO, "tecton-screenshots")
const EXECUTABLE =
  process.env.CHROMIUM_PATH ??
  path.join(
    process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers",
    "chromium"
  )

async function waitFor(url: string, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Server at ${url} did not start`)
}

async function findChromium() {
  const candidates = [EXECUTABLE]
  try {
    for (const entry of await fs.readdir(path.dirname(EXECUTABLE))) {
      if (entry.startsWith("chromium")) {
        candidates.push(
          path.join(path.dirname(EXECUTABLE), entry, "chrome-linux", "chrome")
        )
        candidates.push(
          path.join(path.dirname(EXECUTABLE), entry, "chrome-linux64", "chrome")
        )
      }
    }
  } catch {
    // ignore
  }
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) return candidate
    } catch {
      // next
    }
  }
  return undefined
}

const DETACHED = process.platform !== "win32"
const PORT = process.env.COMPARE_PORT ?? "4173"

/**
 * `vite preview` on port 4173 (COMPARE_PORT), started with node directly (no
 * npx wrapper, whose `kill()` would leave vite running) in its own process
 * group.
 */
function startPreview() {
  // `vite/bin/vite.js` is not in vite's exports map; resolve the package.
  const vitePackage = createRequire(path.join(WWW, "package.json")).resolve(
    "vite/package.json"
  )
  const vite = path.join(path.dirname(vitePackage), "bin", "vite.js")
  const server = spawn(
    process.env.NODE_BINARY ?? "node",
    [vite, "preview", "--port", PORT, "--strictPort"],
    { cwd: WWW, stdio: ["ignore", "pipe", "pipe"], detached: DETACHED }
  )
  // Resolves once this vite prints its URL. With --strictPort it exits when
  // the port is taken: fail then, instead of capturing whatever else answers.
  const ready = new Promise<void>((resolve, reject) => {
    let output = ""
    const onData = (chunk: Buffer) => {
      output += chunk.toString()
      // eslint-disable-next-line no-control-regex -- strip ANSI colours
      if (output.replace(/\x1b\[[0-9;]*m/g, "").includes(`:${PORT}/`)) resolve()
    }
    server.stdout.on("data", onData)
    server.stderr.on("data", onData)
    server.on("error", reject)
    setTimeout(
      () => reject(new Error(`vite preview did not start:\n${output}`)),
      60_000
    ).unref()
    server.on("exit", (code) =>
      reject(
        new Error(
          `vite preview exited (code ${code}) on port ${PORT}:\n${output}`
        )
      )
    )
  })
  return { server, ready }
}

function stopPreview(server: ChildProcess) {
  if (server.exitCode !== null || server.pid === undefined) return
  try {
    // The whole group: vite and anything it spawned.
    if (DETACHED) process.kill(-server.pid, "SIGTERM")
    else server.kill()
  } catch {
    // already gone
  }
}

async function main() {
  let baseUrl = process.env.BASE_URL
  let server: ChildProcess | undefined
  let ready: Promise<void> | undefined
  if (!baseUrl) {
    ;({ server, ready } = startPreview())
    baseUrl = `http://127.0.0.1:${PORT}`
  }
  try {
    await ready
    await waitFor(`${baseUrl}/`)
    await capture(baseUrl)
  } finally {
    if (server) stopPreview(server)
  }
}

async function capture(baseUrl: string) {
  const executablePath = await findChromium()
  const browser = await chromium.launch({ executablePath })
  try {
    return await captureAll(browser, baseUrl)
  } finally {
    await browser.close()
  }
}

async function captureAll(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseUrl: string
) {
  const { compareMatrices } = await import("../src/compare/matrices")
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  })
  const page = await context.newPage()
  await fs.mkdir(OUT, { recursive: true })

  const rows: {
    key: string
    title: string
    reference: string
    hasReference: boolean
  }[] = []
  const tokenMismatches: { name: string; expected: string; actual: string }[] =
    []

  for (const [key, matrix] of Object.entries(compareMatrices)) {
    await page.goto(`${baseUrl}/compare/${key}`, { waitUntil: "networkidle" })
    // The matrix is lazy-loaded behind a Suspense spinner.
    await page.waitForSelector("[data-slot=matrix-page]")
    await page.screenshot({
      path: path.join(OUT, `${key}.png`),
      fullPage: true,
    })
    const hasReference = await fs
      .stat(path.join(SHOTS, matrix.reference))
      .then(() => true)
      .catch(() => false)
    rows.push({
      key,
      title: matrix.title,
      reference: matrix.reference,
      hasReference,
    })

    if (key === "tokens") {
      const measured = await page.$$eval("[data-token]", (nodes) =>
        nodes.map((node) => {
          const swatch = node.querySelector("[data-slot=color-swatch]")
          return {
            name: node.getAttribute("data-token") ?? "",
            expected: (node.getAttribute("data-value") ?? "").toLowerCase(),
            actual: swatch
              ? getComputedStyle(swatch).backgroundColor
              : "(no swatch)",
          }
        })
      )
      console.log(`[compare] measured ${measured.length} token swatches`)
      if (measured.length === 0) {
        tokenMismatches.push({
          name: "(none)",
          expected: "swatches",
          actual: "no [data-token] elements rendered",
        })
      }
      for (const m of measured) {
        const hex = m.expected.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/)
        if (!hex) {
          tokenMismatches.push({
            name: m.name,
            expected: m.expected,
            actual: "not a #rrggbb[aa] value, cannot compare",
          })
          continue
        }
        const [r, g, b] = [0, 2, 4].map((i) =>
          parseInt(hex[1].slice(i, i + 2), 16)
        )
        const alpha = hex[2] ? parseInt(hex[2], 16) / 255 : 1
        const expectedRgb =
          alpha === 1
            ? `rgb(${r}, ${g}, ${b})`
            : `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
        const actual = m.actual.replace(/(\d+\.\d{3})\d+/g, "$1")
        if (
          actual !== expectedRgb &&
          !(alpha !== 1 && actual.startsWith(`rgba(${r}, ${g}, ${b}`))
        ) {
          tokenMismatches.push({
            name: m.name,
            expected: expectedRgb,
            actual: m.actual,
          })
        }
      }
    }
  }

  const html = `<!doctype html><meta charset="utf-8"><title>Tecton UI — screenshot comparison</title>
<style>
body{margin:0;background:#1d1c1f;color:#f6f5f8;font:14px system-ui,sans-serif}
header{padding:16px 24px;border-bottom:1px solid #342f39}
section{padding:16px 24px;border-bottom:1px solid #342f39}
h2{font-size:14px;margin:0 0 8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
figure{margin:0}figcaption{font-size:12px;color:#a7a2ac;margin-bottom:6px}
img{width:100%;border:1px solid #342f39;background:#131214}
.missing{padding:24px;border:1px dashed #57515c;color:#a7a2ac;font-size:12px}
table{border-collapse:collapse;font-size:12px}td,th{padding:4px 8px;border-bottom:1px solid #342f39;text-align:left}
</style>
<header><strong>Tecton UI</strong> — rendered state matrices (left) next to the Tecton Storybook captures (right). Generated by apps/www/e2e/compare.spec.ts.</header>
${rows
  .map(
    (
      row
    ) => `<section><h2>${row.title} <code style="color:#a7a2ac">/compare/${row.key}</code></h2>
<div class="grid">
<figure><figcaption>Tecton UI</figcaption><img src="./${row.key}.png" alt="${row.key}"></figure>
<figure><figcaption>${row.reference}</figcaption>${
      row.hasReference
        ? `<img src="../../../../tecton-screenshots/${row.reference}" alt="${row.reference}">`
        : `<div class="missing">Reference capture not found: ${row.reference}</div>`
    }</figure>
</div></section>`
  )
  .join("\n")}
<section><h2>Token swatches vs tecton-tokens.css</h2>
${
  tokenMismatches.length
    ? `<table><tr><th>token</th><th>expected</th><th>rendered</th></tr>${tokenMismatches
        .map(
          (m) =>
            `<tr><td>${m.name}</td><td>${m.expected}</td><td>${m.actual}</td></tr>`
        )
        .join("")}</table>`
    : `<p>All measured swatches match their token values exactly.</p>`
}
</section>`
  await fs.writeFile(path.join(OUT, "index.html"), html)

  console.log(
    `[compare] ${rows.length} matrices captured → ${path.relative(REPO, OUT)}/index.html`
  )
  if (tokenMismatches.length) {
    console.error(
      `[compare] ${tokenMismatches.length} token swatches differ from tecton-tokens.css`
    )
    // Not process.exit(): the browser and the preview server are closed first.
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
