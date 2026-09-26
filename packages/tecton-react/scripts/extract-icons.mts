/**
 * extract-icons — pulls the Tecton icon glyphs into `icons-src/<variant>/<slug>.svg`.
 *
 *   bun run scripts/extract-icons.mts                 # scrape the Storybook gallery
 *   bun run scripts/extract-icons.mts --from-dir X    # copy an exported SVG folder
 *
 * Two input modes
 * ---------------
 * 1. Storybook (default). Requires `playwright-core`, which is NOT a workspace
 *    dependency — install it once with:
 *
 *        pnpm add -Dw playwright-core
 *
 *    The Chromium build is taken from `PLAYWRIGHT_BROWSERS_PATH` (defaults to
 *    `/opt/pw-browsers`, where this environment keeps a pre-installed build).
 *    The script
 *      a. fetches `<storybook>/index.json`, finds the icon-gallery story
 *         (title contains "Icon"; prefers a story name containing "Gallery"),
 *      b. opens `<storybook>/iframe.html?id=<storyId>&viewMode=story`,
 *      c. for each variant toggle (Outlined | Filled) collects every `<svg>`
 *         on the page together with its nearest `…Icon` label,
 *      d. normalises each SVG (see `icon-utils.mts#normalizeSvg`) and writes
 *         `icons-src/<variant>/<slug>.svg`.
 *
 *    Env:  TECTON_STORYBOOK_URL   Storybook root (default below)
 *          PLAYWRIGHT_BROWSERS_PATH  where Playwright looks for Chromium
 *          TECTON_ICON_TIMEOUT    per-page timeout in ms (default 60000)
 *
 * 2. `--from-dir <dir>`. Copies + normalises SVGs from a folder that a designer
 *    exported (Figma, MUI `@mui/icons-material` build, …). Accepts either
 *      <dir>/outlined/*.svg + <dir>/filled/*.svg      (variant folders), or
 *      <dir>/*.svg                                    (treated as outlined), or
 *      <dir>/*Outlined.svg, <dir>/*Filled.svg         (variant suffixes).
 *    File names are matched to manifest slugs after slugifying
 *    (`AddCircleIcon.svg` → `add-circle`), so any of the gallery labels work.
 *
 * Flags
 *   --from-dir <dir>   input mode 2 (see above)
 *   --variant <name>   only extract one variant (`outlined` | `filled`)
 *   --only <slug,…>    only extract the listed slugs
 *   --dry-run          report what would be written, write nothing
 *
 * After extracting, run `pnpm icons:build` to regenerate `src/icons/`.
 *
 * NOTE: this script cannot be exercised in the environment it was written in
 * (the Storybook host is blocked), so the DOM heuristics in `collectGallerySvgs`
 * are intentionally generic and the script fails loudly rather than guessing.
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ICONS_SRC_DIR,
  ICON_VARIANTS,
  type IconManifest,
  type IconVariant,
  findIconBy,
  isShippedIcon,
  loadManifest,
  normalizeSvg,
  pkgRoot,
  toSlug,
} from "./icon-utils.mjs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DEFAULT_STORYBOOK_URL = "https://storybook-static-kappa-roan.vercel.app/mui/";
const STORYBOOK_URL = (process.env.TECTON_STORYBOOK_URL ?? DEFAULT_STORYBOOK_URL).replace(/\/?$/, "/");
const TIMEOUT = Number(process.env.TECTON_ICON_TIMEOUT ?? 60_000);

/**
 * Slugs whose literal colours must be preserved verbatim. Gradient/pattern
 * references (`url(#…)`) and `<stop>` colours always survive normalisation,
 * so even the multi-colour `strata` glyph does not need to be listed — its
 * monochrome layers should follow `currentColor` like every other icon.
 */
const KEEP_COLOR_SLUGS = new Set<string>([]);

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
interface CliOptions {
  fromDir?: string;
  variant?: IconVariant;
  only?: Set<string>;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} expects a value`);
      return v;
    };
    switch (arg) {
      case "--from-dir":
        opts.fromDir = path.resolve(next());
        break;
      case "--variant": {
        const v = next() as IconVariant;
        if (!ICON_VARIANTS.includes(v)) throw new Error(`--variant must be one of ${ICON_VARIANTS.join(", ")}`);
        opts.variant = v;
        break;
      }
      case "--only":
        opts.only = new Set(next().split(",").map((s) => toSlug(s.trim())));
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      default:
        throw new Error(`unknown argument: ${arg} (try --help)`);
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(
    [
      "usage: bun run scripts/extract-icons.mts [--from-dir <dir>] [--variant outlined|filled] [--only a,b] [--dry-run]",
      "",
      "  default        scrape TECTON_STORYBOOK_URL (needs `pnpm add -Dw playwright-core`)",
      "  --from-dir     import an exported SVG folder instead",
    ].join("\n"),
  );
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
interface ExtractedSvg {
  variant: IconVariant;
  slug: string;
  /** Original label / file name, for logging. */
  label: string;
  svg: string;
}

interface WriteStats {
  written: number;
  skipped: number;
  unknown: string[];
  missing: Record<IconVariant, string[]>;
}

/** Normalise + write every extracted SVG; report which manifest icons are still missing. */
function writeExtracted(items: ExtractedSvg[], manifest: IconManifest, opts: CliOptions): WriteStats {
  const stats: WriteStats = { written: 0, skipped: 0, unknown: [], missing: { outlined: [], filled: [] } };
  const seen: Record<IconVariant, Set<string>> = { outlined: new Set(), filled: new Set() };

  for (const item of items) {
    if (opts.variant && item.variant !== opts.variant) continue;
    if (opts.only && !opts.only.has(item.slug)) continue;

    const entry = findIconBy(manifest, item.slug);
    if (!entry) {
      stats.unknown.push(`${item.variant}/${item.label}`);
      stats.skipped++;
      continue;
    }
    if (seen[item.variant].has(entry.slug)) {
      stats.skipped++;
      continue;
    }
    seen[item.variant].add(entry.slug);

    let normalised: string;
    try {
      normalised = normalizeSvg(item.svg, { keepColors: KEEP_COLOR_SLUGS.has(entry.slug) });
    } catch (err) {
      console.warn(`warning: could not normalise ${item.variant}/${item.label}: ${(err as Error).message}`);
      stats.skipped++;
      continue;
    }

    const outDir = path.join(ICONS_SRC_DIR, item.variant);
    const outFile = path.join(outDir, `${entry.slug}.svg`);
    if (opts.dryRun) {
      console.log(`[dry-run] would write ${path.relative(pkgRoot, outFile)}`);
    } else {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, normalised, "utf8");
    }
    stats.written++;
  }

  for (const variant of ICON_VARIANTS) {
    if (opts.variant && variant !== opts.variant) continue;
    // Only shipped icons need a source; the rest of the export is not generated.
    for (const icon of manifest.icons.filter(isShippedIcon)) {
      if (opts.only && !opts.only.has(icon.slug)) continue;
      const file = path.join(ICONS_SRC_DIR, variant, `${icon.slug}.svg`);
      if (!seen[variant].has(icon.slug) && !existsSync(file)) stats.missing[variant].push(icon.slug);
    }
  }
  return stats;
}

function report(stats: WriteStats, dryRun: boolean): void {
  console.log(`\n${dryRun ? "would write" : "wrote"} ${stats.written} svg(s), skipped ${stats.skipped}`);
  if (stats.unknown.length) {
    console.log(`\nnot in icons/icons.json (add them or ignore):\n  ${stats.unknown.join("\n  ")}`);
  }
  for (const variant of ICON_VARIANTS) {
    const missing = stats.missing[variant];
    if (missing.length) {
      console.log(`\nstill missing ${variant} sources for ${missing.length} icon(s):\n  ${missing.join(", ")}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Mode 2: --from-dir
// ---------------------------------------------------------------------------
function collectFromDir(dir: string): ExtractedSvg[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`--from-dir: not a directory: ${dir}`);
  const items: ExtractedSvg[] = [];

  const readFolder = (folder: string, variantOf: (fileName: string) => IconVariant, strip: RegExp | null) => {
    if (!existsSync(folder)) return;
    // sorted, so duplicate slugs resolve the same way on every file system
    const entries = readdirSync(folder, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".svg")) continue;
      const base = entry.name.replace(/\.svg$/i, "");
      const label = strip ? base.replace(strip, "") : base;
      items.push({
        variant: variantOf(entry.name),
        slug: toSlug(label),
        label: entry.name,
        svg: readFileSync(path.join(folder, entry.name), "utf8"),
      });
    }
  };

  // <dir>/outlined/*.svg and <dir>/filled/*.svg
  for (const variant of ICON_VARIANTS) readFolder(path.join(dir, variant), () => variant, null);
  // <dir>/*.svg — suffix decides the variant, default outlined
  readFolder(
    dir,
    (name) => (/filled\.svg$/i.test(name) ? "filled" : "outlined"),
    /[-_ ]?(outlined|filled)$/i,
  );
  return items;
}

// ---------------------------------------------------------------------------
// Mode 1: Storybook via playwright-core
// ---------------------------------------------------------------------------

/**
 * Minimal structural types for the slice of the Playwright API we use, so the
 * script type-checks even when `playwright-core` is not installed.
 */
interface PwPage {
  goto(url: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; timeout?: number }): Promise<unknown>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<R, A>(fn: (arg: A) => R, arg: A): Promise<R>;
  setDefaultTimeout(ms: number): void;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
}
interface PwBrowser {
  newPage(): Promise<PwPage>;
  close(): Promise<void>;
}
interface PwChromium {
  launch(options?: { headless?: boolean }): Promise<PwBrowser>;
}

async function loadPlaywright(): Promise<PwChromium> {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";
  try {
    // playwright-core is an optional, on-demand dependency (see header).
    // @ts-ignore -- module may not be installed; resolved at runtime only.
    const mod = (await import("playwright-core")) as { chromium: PwChromium };
    return mod.chromium;
  } catch (err) {
    throw new Error(
      `playwright-core is not installed (${(err as Error).message}).\n` +
        `Install it with:  pnpm add -Dw playwright-core\n` +
        `…or import an exported folder instead:  --from-dir <dir>`,
    );
  }
}

interface StorybookIndexEntry {
  id: string;
  title: string;
  name: string;
  type?: string;
}

/** Fetch `<storybook>/index.json` (Storybook 7+) or `stories.json` (6.x) and pick the gallery story. */
async function findGalleryStory(): Promise<StorybookIndexEntry> {
  const candidates = ["index.json", "stories.json"];
  let entries: StorybookIndexEntry[] | undefined;
  let lastError: string | undefined;
  for (const file of candidates) {
    const url = STORYBOOK_URL + file;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = `${url} → HTTP ${res.status}`;
        continue;
      }
      const json = (await res.json()) as { entries?: Record<string, StorybookIndexEntry>; stories?: Record<string, StorybookIndexEntry> };
      entries = Object.values(json.entries ?? json.stories ?? {});
      break;
    } catch (err) {
      lastError = `${url} → ${(err as Error).message}`;
    }
  }
  if (!entries) throw new Error(`could not load the Storybook index: ${lastError ?? "unknown error"}`);

  const stories = entries.filter((e) => (e.type ?? "story") === "story" && /icon/i.test(e.title));
  if (!stories.length) {
    throw new Error(`no story with "Icon" in its title found at ${STORYBOOK_URL} — set TECTON_STORYBOOK_URL?`);
  }
  // Prefer an explicit gallery; otherwise the first icon story.
  return stories.find((e) => /gallery/i.test(e.name) || /gallery/i.test(e.id)) ?? stories[0];
}

/**
 * Runs inside the browser. Clicks the variant toggle (if any) and returns
 * every `<svg>` together with the nearest `…Icon` label text.
 *
 * Heuristics (kept deliberately loose — the gallery markup is not known here):
 *   - toggle: any button / tab / label whose text is exactly the variant name
 *   - label: walk up ≤ 6 ancestors from each <svg>; the first ancestor whose
 *     own text (excluding nested svg) matches /^[A-Z]\w*Icon$/ wins. Falls back
 *     to `data-testid` / `aria-label` on the svg (MUI sets `data-testid="AddCircleIcon"`).
 */
function collectGallerySvgs(variantLabel: string): { clicked: boolean; items: { label: string; svg: string }[] } {
  const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

  // 1. Click the variant toggle.
  let clicked = false;
  const clickable = Array.from(document.querySelectorAll<HTMLElement>('button, [role="tab"], [role="radio"], label, [role="button"]'));
  const target = clickable.find((el) => norm(el.textContent) === variantLabel.toLowerCase());
  if (target) {
    target.click();
    clicked = true;
  }

  // 2. Collect svgs + labels.
  const labelRe = /^[A-Z][A-Za-z0-9]*Icon$/;
  const ownText = (el: Element) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const items: { label: string; svg: string }[] = [];
  for (const svg of Array.from(document.querySelectorAll("svg"))) {
    // skip toggle / search-field icons: they live inside interactive controls
    if (svg.closest("button, [role=tab], [role=radio], input, [role=combobox], [role=searchbox]")) continue;

    let label = svg.getAttribute("data-testid") ?? svg.getAttribute("aria-label") ?? "";
    if (!labelRe.test(label)) {
      label = "";
      let el: Element | null = svg.parentElement;
      for (let depth = 0; el && depth < 6 && !label; depth++, el = el.parentElement) {
        // direct text on the ancestor, or a text-only descendant (e.g. a <span>)
        const candidates = [ownText(el), ...Array.from(el.querySelectorAll("*")).filter((c) => !c.querySelector("*") && !c.closest("svg")).map((c) => (c.textContent ?? "").trim())];
        label = candidates.find((t) => labelRe.test(t)) ?? "";
      }
    }
    if (!label) continue;
    items.push({ label, svg: svg.outerHTML });
  }
  return { clicked, items };
}

async function collectFromStorybook(opts: CliOptions): Promise<ExtractedSvg[]> {
  const chromium = await loadPlaywright();
  const story = await findGalleryStory();
  const url = `${STORYBOOK_URL}iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
  console.log(`gallery story: ${story.title} / ${story.name} (${story.id})\n${url}`);

  const browser = await chromium.launch({ headless: true });
  const items: ExtractedSvg[] = [];
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    // A tall viewport avoids virtualised / lazy rows hiding icons.
    await page.setViewportSize({ width: 1600, height: 4000 });
    await page.goto(url, { waitUntil: "networkidle", timeout: TIMEOUT });
    await page.waitForSelector("svg", { timeout: TIMEOUT });

    const variants = opts.variant ? [opts.variant] : ICON_VARIANTS;
    for (const variant of variants) {
      const label = variant.charAt(0).toUpperCase() + variant.slice(1); // "Outlined" | "Filled"
      const { clicked, items: found } = await page.evaluate(collectGallerySvgs, label);
      if (clicked) {
        // give React a beat to re-render, then re-collect with the toggle applied
        await page.waitForTimeout(500);
      } else if (variant !== "outlined") {
        console.warn(`warning: no "${label}" toggle found — skipping ${variant} variant`);
        continue;
      }
      const result = clicked ? await page.evaluate(collectGallerySvgs, label) : { items: found };
      console.log(`${variant}: found ${result.items.length} labelled svg(s)`);
      for (const item of result.items) {
        items.push({ variant, slug: toSlug(item.label), label: item.label, svg: item.svg });
      }
    }
  } finally {
    await browser.close();
  }
  if (!items.length) {
    throw new Error("no labelled <svg> elements found in the gallery — inspect the story markup and adjust collectGallerySvgs()");
  }
  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();

  const items = opts.fromDir ? collectFromDir(opts.fromDir) : await collectFromStorybook(opts);
  console.log(`collected ${items.length} svg(s) from ${opts.fromDir ?? STORYBOOK_URL}`);

  const stats = writeExtracted(items, manifest, opts);
  report(stats, opts.dryRun);
  if (!opts.dryRun && stats.written) console.log("\nnext: pnpm icons:build");
}

main().catch((err: unknown) => {
  console.error(`extract-icons: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
