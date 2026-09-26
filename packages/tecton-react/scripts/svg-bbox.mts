/**
 * svg-bbox — the exact geometric bounding box of an SVG's visible geometry,
 * and the viewBox crop `build-icons.mts` derives from it.
 *
 * Why this exists
 *   The Tecton export draws every glyph on a 16-unit grid with the glyph's own
 *   margin baked in, so a Tecton icon rendered at 24px looks smaller than a
 *   lucide icon at 24px. `cropViewBox()` trims the viewBox by a uniform,
 *   centred inset so the glyph fills more of the rendered box — but only by as
 *   much as that particular glyph can spare, which is what the bbox is for.
 *
 * Scope
 *   - Measures `path` (M m L l H h V v C c S s Q q T t A a Z z), `rect`,
 *     `circle`, `ellipse`, `line`, `polyline` and `polygon`.
 *   - Cubic and quadratic extrema are solved analytically (the control hull is
 *     not a tight bound); arcs are converted to cubics first.
 *   - `transform` (translate / scale / rotate / matrix / skewX / skewY) is
 *     honoured, including nested `<g transform>`, by mapping control points —
 *     exact for Béziers, since an affine map takes a Bézier to a Bézier.
 *   - Definition-only content draws nothing and is skipped: `defs`, `clipPath`,
 *     `mask`, `foreignObject`, gradients, `pattern`, `symbol`, `marker`,
 *     `filter`, `style`, `script` and anything marked
 *     `data-figma-skip-parse="true"`.
 *   - `text`, `tspan`, `textPath`, `use` and `image` paint but cannot be
 *     measured here (fonts, references). `measureSvg()` reports them, and
 *     `opticalCrop()` keeps the original viewBox for a glyph that has one.
 *
 * Deliberate limitations (safe for the icon sources, worth knowing)
 *   - This is the FILL box. A `stroke` widens the painted area by half the
 *     stroke-width on each side and is NOT accounted for. No icon source
 *     carries a stroke today; if one ever does, the crop would be that much
 *     too generous, so `cropViewBox()` is only ever asked to shrink the box by
 *     a bounded amount, never to fit it tightly.
 *   - `clip-path` / `mask` references are ignored, so a clipped shape measures
 *     as its unclipped self — again, an over-estimate, which is the safe
 *     direction for a crop.
 *
 * Dependency-free (node built-ins only, and in fact none) so it runs under
 * `bun`, `tsx` and vitest without extra installs — same contract as
 * `icon-utils.mts`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An axis-aligned box in user units. */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** A parsed `viewBox="minX minY width height"`. */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 2D affine transform `[a b c d e f]` = `[a c e; b d f; 0 0 1]`. */
type Matrix = readonly [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

// ---------------------------------------------------------------------------
// Matrices
// ---------------------------------------------------------------------------

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** Parse an SVG `transform` attribute (a list of transform functions). */
export function parseTransform(value: string): Matrix {
  let out: Matrix = IDENTITY;
  for (const fn of value.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const args = fn[2]
      .split(/[\s,]+/)
      .filter((t) => t.length > 0)
      .map(Number);
    let step: Matrix;
    switch (fn[1]) {
      case "translate":
        step = [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0];
        break;
      case "scale":
        step = [args[0] ?? 1, 0, 0, args[1] ?? args[0] ?? 1, 0, 0];
        break;
      case "rotate": {
        const rad = ((args[0] ?? 0) * Math.PI) / 180;
        const rotation: Matrix = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
        // `rotate(a cx cy)` rotates about (cx, cy).
        step =
          args.length >= 3
            ? multiply(multiply([1, 0, 0, 1, args[1], args[2]], rotation), [1, 0, 0, 1, -args[1], -args[2]])
            : rotation;
        break;
      }
      case "matrix":
        step = [args[0] ?? 1, args[1] ?? 0, args[2] ?? 0, args[3] ?? 1, args[4] ?? 0, args[5] ?? 0];
        break;
      case "skewX":
        step = [1, 0, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
        break;
      case "skewY":
        step = [1, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
        break;
      default:
        // An unknown transform function is ignored rather than fatal: the box
        // it would have produced is still covered by the untransformed points.
        step = IDENTITY;
    }
    out = multiply(out, step);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Bounds accumulator
// ---------------------------------------------------------------------------

class BoundsBuilder {
  private minX = Infinity;
  private minY = Infinity;
  private maxX = -Infinity;
  private maxY = -Infinity;

  add(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < this.minX) this.minX = x;
    if (y < this.minY) this.minY = y;
    if (x > this.maxX) this.maxX = x;
    if (y > this.maxY) this.maxY = y;
  }

  result(): Bounds | null {
    if (!Number.isFinite(this.minX)) return null;
    return { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };
  }
}

// ---------------------------------------------------------------------------
// Bézier maths
// ---------------------------------------------------------------------------

/** Parameters in (0, 1) where a cubic's derivative vanishes, per axis. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  // B'(t) = 3(1-t)²(p1-p0) + 6(1-t)t(p2-p1) + 3t²(p3-p2), expanded as at² + bt + c.
  const a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3);
  const b = 6 * (p0 - 2 * p1 + p2);
  const c = 3 * (p1 - p0);
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      roots.push((-b + root) / (2 * a), (-b - root) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Add a cubic segment. The transform is applied to the control points first,
 * which is exact: an affine map sends a Bézier to the Bézier of the mapped
 * control points.
 */
function addCubic(
  into: BoundsBuilder,
  m: Matrix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): void {
  const [ax, ay] = applyMatrix(m, x0, y0);
  const [bx, by] = applyMatrix(m, x1, y1);
  const [cx, cy] = applyMatrix(m, x2, y2);
  const [dx, dy] = applyMatrix(m, x3, y3);
  into.add(ax, ay);
  into.add(dx, dy);
  for (const t of cubicExtrema(ax, bx, cx, dx)) {
    into.add(cubicAt(ax, bx, cx, dx, t), cubicAt(ay, by, cy, dy, t));
  }
  for (const t of cubicExtrema(ay, by, cy, dy)) {
    into.add(cubicAt(ax, bx, cx, dx, t), cubicAt(ay, by, cy, dy, t));
  }
}

/**
 * Endpoint-parameterised arc → a chain of cubics (SVG 1.1 implementation notes,
 * F.6.5 / F.6.6), at most a quarter turn each so the approximation error is far
 * below anything a 3-decimal viewBox can express.
 */
function arcToCubics(
  x0: number,
  y0: number,
  rxInput: number,
  ryInput: number,
  rotationDeg: number,
  largeArc: number,
  sweep: number,
  x1: number,
  y1: number,
): number[][] {
  let rx = Math.abs(rxInput);
  let ry = Math.abs(ryInput);
  // A zero radius degenerates to a straight line (SVG F.6.2).
  if (rx === 0 || ry === 0) return [[x0, y0, x0, y0, x1, y1, x1, y1]];

  const phi = (rotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const halfDx = (x0 - x1) / 2;
  const halfDy = (y0 - y1) / 2;
  const x1p = cosPhi * halfDx + sinPhi * halfDy;
  const y1p = -sinPhi * halfDx + cosPhi * halfDy;

  // Scale up radii that are too small to join the endpoints (SVG F.6.6).
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const denom = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const numer = Math.max(0, rx * rx * ry * ry - denom);
  const coef = sign * Math.sqrt(numer / denom);
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    const a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    return ux * vy - uy * vx < 0 ? -a : a;
  };
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const theta = angle(1, 0, ux, uy);
  let sweepAngle = angle(ux, uy, vx, vy);
  if (sweep === 0 && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
  if (sweep === 1 && sweepAngle < 0) sweepAngle += 2 * Math.PI;

  const steps = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)));
  const delta = sweepAngle / steps;
  const kappa = (4 / 3) * Math.tan(delta / 4);
  const pointAt = (a: number): [number, number] => [
    cx + rx * Math.cos(a) * cosPhi - ry * Math.sin(a) * sinPhi,
    cy + rx * Math.cos(a) * sinPhi + ry * Math.sin(a) * cosPhi,
  ];
  const tangentAt = (a: number): [number, number] => [
    -rx * Math.sin(a) * cosPhi - ry * Math.cos(a) * sinPhi,
    -rx * Math.sin(a) * sinPhi + ry * Math.cos(a) * cosPhi,
  ];

  const out: number[][] = [];
  let from = theta;
  let px = x0;
  let py = y0;
  for (let i = 0; i < steps; i++) {
    const to = from + delta;
    const [ex, ey] = pointAt(to);
    const [t1x, t1y] = tangentAt(from);
    const [t2x, t2y] = tangentAt(to);
    out.push([px, py, px + kappa * t1x, py + kappa * t1y, ex - kappa * t2x, ey - kappa * t2y, ex, ey]);
    px = ex;
    py = ey;
    from = to;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Path data
// ---------------------------------------------------------------------------

/** Argument count per path command (lower-case key). */
const PATH_ARITY: Record<string, number> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
  z: 0,
};

interface PathSegment {
  command: string;
  args: number[];
}

/** A path number: optional sign, digits with at most one point, optional exponent. */
const PATH_NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
/** Whitespace and the optional comma between two path arguments. */
const PATH_SEPARATOR = /[\s,]*/y;
const PATH_COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/;

/**
 * Split a `d` attribute into segments, expanding implicit repeats.
 *
 * A cursor, not a tokenising regex, because the grammar is context-dependent:
 * the two arc flags are single `0`/`1` characters that need no separator, so
 * the compact `a1 1 0 011 1` a minifier writes is `large-arc 0, sweep 1, x 1`,
 * not the number `11`. Numbers follow the SVG grammar too: `1.5.5` is `1.5`
 * then `.5`, and `1-2` is `1` then `-2`.
 */
export function parsePathData(d: string): PathSegment[] {
  let pos = 0;
  const skipSeparators = () => {
    PATH_SEPARATOR.lastIndex = pos;
    PATH_SEPARATOR.exec(d);
    pos = PATH_SEPARATOR.lastIndex;
  };
  const readNumber = (command: string, arity: number, flag: boolean): number => {
    skipSeparators();
    if (flag) {
      const c = d[pos];
      if (c !== "0" && c !== "1") {
        throw new Error(`svg-bbox: "${command}" wants a 0/1 arc flag in ${d.slice(0, 60)}`);
      }
      pos++;
      return c === "1" ? 1 : 0;
    }
    PATH_NUMBER.lastIndex = pos;
    const m = PATH_NUMBER.exec(d);
    if (!m) throw new Error(`svg-bbox: "${command}" wants ${arity} numbers in ${d.slice(0, 60)}`);
    pos = PATH_NUMBER.lastIndex;
    return Number.parseFloat(m[0]);
  };

  const segments: PathSegment[] = [];
  let command = "";
  for (skipSeparators(); pos < d.length; skipSeparators()) {
    const c = d[pos];
    if (PATH_COMMAND.test(c)) {
      command = c;
      pos++;
    } else if (/[a-zA-Z]/.test(c)) {
      throw new Error(`svg-bbox: unknown path command "${c}"`);
    } else if (!command) {
      throw new Error(`svg-bbox: path data starts with a number: ${d.slice(0, 40)}`);
    }
    const arity = PATH_ARITY[command.toLowerCase()];
    if (arity === 0) {
      segments.push({ command, args: [] });
      command = "";
      continue;
    }
    const isArc = command === "A" || command === "a";
    const args: number[] = [];
    for (let i = 0; i < arity; i++) args.push(readNumber(command, arity, isArc && (i === 3 || i === 4)));
    segments.push({ command, args });
    // An implicit repeat after a moveto is a lineto (SVG 8.3.2).
    if (command === "M") command = "L";
    else if (command === "m") command = "l";
  }
  return segments;
}

/** Accumulate a `d` attribute's geometry into `into`, through transform `m`. */
function addPathData(into: BoundsBuilder, d: string, m: Matrix): void {
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  /** Previous cubic's second control point, for the `S`/`s` reflection. */
  let prevCubicControl: [number, number] | null = null;
  /** Previous quadratic's control point, for the `T`/`t` reflection. */
  let prevQuadControl: [number, number] | null = null;

  const addLine = (x0: number, y0: number, x1: number, y1: number): void => {
    const [ax, ay] = applyMatrix(m, x0, y0);
    const [bx, by] = applyMatrix(m, x1, y1);
    into.add(ax, ay);
    into.add(bx, by);
  };

  for (const segment of parsePathData(d)) {
    const relative = segment.command === segment.command.toLowerCase();
    const a = segment.args;
    switch (segment.command.toUpperCase()) {
      case "M": {
        // A moveto paints nothing on its own, so it contributes no point.
        x = relative ? x + a[0] : a[0];
        y = relative ? y + a[1] : a[1];
        startX = x;
        startY = y;
        prevCubicControl = prevQuadControl = null;
        break;
      }
      case "L": {
        const nx = relative ? x + a[0] : a[0];
        const ny = relative ? y + a[1] : a[1];
        addLine(x, y, nx, ny);
        x = nx;
        y = ny;
        prevCubicControl = prevQuadControl = null;
        break;
      }
      case "H": {
        const nx = relative ? x + a[0] : a[0];
        addLine(x, y, nx, y);
        x = nx;
        prevCubicControl = prevQuadControl = null;
        break;
      }
      case "V": {
        const ny = relative ? y + a[0] : a[0];
        addLine(x, y, x, ny);
        y = ny;
        prevCubicControl = prevQuadControl = null;
        break;
      }
      case "C": {
        const c1x = relative ? x + a[0] : a[0];
        const c1y = relative ? y + a[1] : a[1];
        const c2x = relative ? x + a[2] : a[2];
        const c2y = relative ? y + a[3] : a[3];
        const ex = relative ? x + a[4] : a[4];
        const ey = relative ? y + a[5] : a[5];
        addCubic(into, m, x, y, c1x, c1y, c2x, c2y, ex, ey);
        prevCubicControl = [c2x, c2y];
        prevQuadControl = null;
        x = ex;
        y = ey;
        break;
      }
      case "S": {
        const c1x = prevCubicControl ? 2 * x - prevCubicControl[0] : x;
        const c1y = prevCubicControl ? 2 * y - prevCubicControl[1] : y;
        const c2x = relative ? x + a[0] : a[0];
        const c2y = relative ? y + a[1] : a[1];
        const ex = relative ? x + a[2] : a[2];
        const ey = relative ? y + a[3] : a[3];
        addCubic(into, m, x, y, c1x, c1y, c2x, c2y, ex, ey);
        prevCubicControl = [c2x, c2y];
        prevQuadControl = null;
        x = ex;
        y = ey;
        break;
      }
      case "Q": {
        const qx = relative ? x + a[0] : a[0];
        const qy = relative ? y + a[1] : a[1];
        const ex = relative ? x + a[2] : a[2];
        const ey = relative ? y + a[3] : a[3];
        // Exact degree elevation: a quadratic IS a cubic.
        addCubic(
          into,
          m,
          x,
          y,
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          ex + (2 / 3) * (qx - ex),
          ey + (2 / 3) * (qy - ey),
          ex,
          ey,
        );
        prevQuadControl = [qx, qy];
        prevCubicControl = null;
        x = ex;
        y = ey;
        break;
      }
      case "T": {
        // Annotated because `prevQuadControl` is reassigned from `qx`/`qy`
        // below, which otherwise makes their inference circular.
        const qx: number = prevQuadControl ? 2 * x - prevQuadControl[0] : x;
        const qy: number = prevQuadControl ? 2 * y - prevQuadControl[1] : y;
        const ex = relative ? x + a[0] : a[0];
        const ey = relative ? y + a[1] : a[1];
        addCubic(
          into,
          m,
          x,
          y,
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          ex + (2 / 3) * (qx - ex),
          ey + (2 / 3) * (qy - ey),
          ex,
          ey,
        );
        prevQuadControl = [qx, qy];
        prevCubicControl = null;
        x = ex;
        y = ey;
        break;
      }
      case "A": {
        const ex = relative ? x + a[5] : a[5];
        const ey = relative ? y + a[6] : a[6];
        for (const c of arcToCubics(x, y, a[0], a[1], a[2], a[3] ? 1 : 0, a[4] ? 1 : 0, ex, ey)) {
          addCubic(into, m, c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]);
        }
        prevCubicControl = prevQuadControl = null;
        x = ex;
        y = ey;
        break;
      }
      case "Z": {
        addLine(x, y, startX, startY);
        x = startX;
        y = startY;
        prevCubicControl = prevQuadControl = null;
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Markup traversal
// ---------------------------------------------------------------------------

/**
 * Elements whose content defines something for later reference rather than
 * painting it. Their subtrees never contribute to the bounding box.
 */
const NON_PAINTING_TAGS = new Set([
  "clippath",
  "defs",
  "desc",
  "filter",
  "foreignobject",
  "lineargradient",
  "marker",
  "mask",
  "metadata",
  "pattern",
  "radialgradient",
  "script",
  "style",
  "symbol",
  "title",
]);

/** Attribute pairs, lower-cased names, entity-decoded values left as authored. */
function readAttributes(source: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of source.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    out.set(m[1].toLowerCase(), m[2] ?? m[3] ?? "");
  }
  return out;
}

/**
 * Elements that paint but that this module cannot measure: the extent of
 * `<text>` depends on the font, `<use>` and `<image>` on what they reference.
 * A glyph that paints one of them has no trustworthy box, so it is not cropped.
 */
const UNMEASURED_TAGS = new Set(["image", "text", "textpath", "tspan", "use"]);

/** What `measureSvg()` found in one fragment. */
export interface Measurement {
  /** The box of the measured geometry, or `null` when none was found. */
  bounds: Bounds | null;
  /**
   * Painting elements that were NOT measured (`text`, `use`, `image`…), in
   * document order, each listed once. When this is not empty, `bounds` may
   * be smaller than what the fragment paints.
   */
  unmeasured: string[];
}

/**
 * The bounding box of everything an SVG fragment actually paints.
 *
 * @param markup Either a whole `<svg>…</svg>` document or a bare inner fragment.
 * @returns The box in the fragment's own user-unit coordinate system, or `null`
 *   when nothing is painted (no shapes, or only definitions). Elements it cannot
 *   measure are left out: use `measureSvg()` to learn about them.
 */
export function svgGeometryBounds(markup: string): Bounds | null {
  return measureSvg(markup).bounds;
}

/** `svgGeometryBounds()`, plus the painting elements it could not measure. */
export function measureSvg(markup: string): Measurement {
  const unmeasured = new Set<string>();
  const builder = new BoundsBuilder();
  // Open elements, innermost last: the transform in force and whether we are
  // inside a subtree that paints nothing.
  const stack: Array<{ tag: string; matrix: Matrix; skipped: boolean }> = [];
  const current = () => stack[stack.length - 1] ?? { tag: "", matrix: IDENTITY, skipped: false };

  // Attribute values may contain `>` only inside quotes, which this allows for.
  const tagRe = /<(\/?)([a-zA-Z][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  for (const token of markup.matchAll(tagRe)) {
    const [, closing, rawTag, attrSource, selfClosing] = token;
    const tag = rawTag.toLowerCase();

    if (closing === "/") {
      // Pop back to the matching open tag, tolerating unbalanced markup.
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const attrs = readAttributes(attrSource);
    const parent = current();
    // Figma writes its conic-gradient hack into a group flagged skip-parse; the
    // real shape is a sibling <path>, so the flagged subtree must not count.
    const skipped = parent.skipped || NON_PAINTING_TAGS.has(tag) || attrs.get("data-figma-skip-parse") === "true";
    const transform = attrs.get("transform");
    const matrix = transform ? multiply(parent.matrix, parseTransform(transform)) : parent.matrix;

    if (!skipped) {
      if (UNMEASURED_TAGS.has(tag)) unmeasured.add(tag);
      else addShape(builder, tag, attrs, matrix);
    }
    if (selfClosing !== "/") stack.push({ tag, matrix, skipped });
  }
  return { bounds: builder.result(), unmeasured: [...unmeasured] };
}

function addShape(into: BoundsBuilder, tag: string, attrs: Map<string, string>, m: Matrix): void {
  const num = (name: string, fallback = 0): number => {
    const raw = attrs.get(name);
    if (raw === undefined || raw.trim() === "") return fallback;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  };
  const addPoint = (x: number, y: number): void => {
    const [px, py] = applyMatrix(m, x, y);
    into.add(px, py);
  };

  switch (tag) {
    case "path": {
      const d = attrs.get("d");
      if (d) addPathData(into, d, m);
      break;
    }
    case "rect": {
      // `rx`/`ry` only round the corners inward, so the box is unaffected.
      const x = num("x");
      const y = num("y");
      const w = num("width");
      const h = num("height");
      if (w <= 0 || h <= 0) break;
      addPoint(x, y);
      addPoint(x + w, y);
      addPoint(x + w, y + h);
      addPoint(x, y + h);
      break;
    }
    case "circle": {
      const r = num("r");
      if (r <= 0) break;
      addEllipse(into, num("cx"), num("cy"), r, r, m);
      break;
    }
    case "ellipse": {
      const rx = num("rx");
      const ry = num("ry");
      if (rx <= 0 || ry <= 0) break;
      addEllipse(into, num("cx"), num("cy"), rx, ry, m);
      break;
    }
    case "line": {
      addPoint(num("x1"), num("y1"));
      addPoint(num("x2"), num("y2"));
      break;
    }
    case "polygon":
    case "polyline": {
      const points = (attrs.get("points") ?? "")
        .split(/[\s,]+/)
        .filter((t) => t.length > 0)
        .map(Number);
      for (let i = 0; i + 1 < points.length; i += 2) addPoint(points[i], points[i + 1]);
      break;
    }
  }
}

/** Two half-turn arcs, so a rotated/skewed ellipse still measures exactly. */
function addEllipse(into: BoundsBuilder, cx: number, cy: number, rx: number, ry: number, m: Matrix): void {
  addPathData(
    into,
    `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`,
    m,
  );
}

// ---------------------------------------------------------------------------
// viewBox cropping
// ---------------------------------------------------------------------------

/** Parse `viewBox="x y width height"`; `null` when it is not four numbers. */
export function parseViewBox(viewBox: string): ViewBox | null {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x, y, width, height] = parts;
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

/**
 * Round DOWN to 3 decimals, absorbing binary-float noise first (the sources are
 * decimal, so a value that is mathematically 0.35 may arrive as
 * 0.34999999999999964 and must not floor to 0.349).
 *
 * Flooring — rather than rounding — is what makes the crop provably lossless:
 * the padding it produces is never larger than the margin actually available.
 */
function floorTo3(value: number): number {
  return Math.floor(value * 1000 + 1e-6) / 1000;
}

/** Round to 3 decimals. Used for values whose exact form already has ≤3. */
function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * `1` not `1.000`, `14.668` not `14.668000000000001`. `String(number)` already
 * prints the shortest round-tripping form, so integers lose their decimals.
 */
function formatCoord(value: number): string {
  return String(roundTo3(value));
}

export interface CropResult {
  /** The viewBox to render with — the original when nothing could be trimmed. */
  viewBox: string;
  /** Margin the glyph actually has, i.e. the most that could ever be trimmed. */
  available: number;
  /** Padding actually trimmed from each side (0 when the glyph reaches an edge). */
  padding: number;
  /** How much larger the glyph renders at a fixed pixel size, e.g. 1.143. */
  scale: number;
  /** False when the original viewBox was kept verbatim. */
  cropped: boolean;
  /**
   * `opticalCrop()` only: the painting elements that could not be measured
   * (`text`, `use`…). When present, the viewBox was kept verbatim, since the
   * glyph's real extent is unknown.
   */
  unmeasured?: string[];
}

/**
 * Shrink `viewBox` by a uniform, centred inset of at most `maxInset` user
 * units, clamped so the glyph described by `bounds` is never clipped.
 *
 * The same result must be used for every variant of an icon, so pass the UNION
 * of the variants' bounds: a per-variant crop would make the glyph jump when
 * the variant is toggled.
 *
 * @param viewBox  The source `viewBox` attribute.
 * @param bounds   Union bounds of the visible geometry, or `null` if there is
 *                 none (then the viewBox is returned untouched).
 * @param maxInset Upper bound on the inset, in the viewBox's user units.
 */
export function cropViewBox(viewBox: string, bounds: Bounds | null, maxInset: number): CropResult {
  const box = parseViewBox(viewBox);
  const unchanged: CropResult = { viewBox, available: 0, padding: 0, scale: 1, cropped: false };
  if (!box || !bounds || maxInset <= 0) return unchanged;

  const available = Math.min(
    bounds.minX - box.x,
    bounds.minY - box.y,
    box.x + box.width - bounds.maxX,
    box.y + box.height - bounds.maxY,
  );
  const padding = floorTo3(Math.max(0, Math.min(maxInset, available)));
  if (padding <= 0) return { ...unchanged, available };

  // Derive the size from the ROUNDED padding so the box stays centred and the
  // two edges stay exactly `padding` inside the original.
  const width = roundTo3(box.width - 2 * padding);
  const height = roundTo3(box.height - 2 * padding);
  // A zero-area glyph (or an absurd maxInset) would otherwise collapse the
  // viewBox, which renders nothing at all. Keeping the original is the only
  // sane answer.
  if (width <= 0 || height <= 0) return { ...unchanged, available };
  const cropped = [box.x + padding, box.y + padding, width, height].map(formatCoord).join(" ");
  return { viewBox: cropped, available, padding, scale: roundTo3(box.width / width), cropped: true };
}

/** The union of two boxes; either may be absent. */
export function unionBounds(a: Bounds | null, b: Bounds | null): Bounds | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * The one crop shared by every variant of an icon: measure all of their markup
 * together, then trim the common viewBox by at most `maxInset`.
 *
 * Measuring the union (rather than each variant on its own) is what keeps the
 * glyph from shifting or rescaling when `variant` is toggled.
 *
 * @param viewBox  The viewBox all the markups were authored on.
 * @param markups  Each variant's SVG — a whole document or a bare fragment.
 * @param maxInset Upper bound on the inset, in the viewBox's user units.
 */
export function opticalCrop(viewBox: string, markups: readonly string[], maxInset: number): CropResult {
  let bounds: Bounds | null = null;
  const unmeasured = new Set<string>();
  for (const markup of markups) {
    const measured = measureSvg(markup);
    bounds = unionBounds(bounds, measured.bounds);
    for (const tag of measured.unmeasured) unmeasured.add(tag);
  }
  // Something paints outside what was measured: a crop could clip it.
  if (unmeasured.size) {
    return { viewBox, available: 0, padding: 0, scale: 1, cropped: false, unmeasured: [...unmeasured] };
  }
  return cropViewBox(viewBox, bounds, maxInset);
}
