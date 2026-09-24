#!/usr/bin/env node
/**
 * Grades the files agents wrote for agent-eval/tasks.json.
 *
 *   node agent-eval/grade.mjs <runs-dir> [--json]
 *
 * <runs-dir>/<condition>/<file> is one attempt. Three measures per file:
 *
 *   type errors   `tsc` against the package source (the same `@tecton/react/*`
 *                 paths the package uses), so a Radix prop, a missing export or
 *                 a wrong module path is an error
 *   rule breaks   the checks the skills ask an agent to run by hand and that
 *                 type-check anyway: stock Tailwind colours, className doing a
 *                 variant's job, onClick, unlabelled icon buttons, icons without
 *                 data-icon, FieldLabel pointing at no id, root imports
 *   expectations  the components and props a correct solution uses (tasks.json)
 *
 * The runs are copied under agent-eval/.runs so module resolution finds the
 * package's node_modules.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const here = path.dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = path.resolve(here, "..")
const args = process.argv.slice(2)
const source = args.find((arg) => !arg.startsWith("--"))
if (!source) {
  console.error("usage: node agent-eval/grade.mjs <runs-dir> [--json]")
  process.exit(1)
}
const asJson = args.includes("--json")
const { tasks } = JSON.parse(
  readFileSync(path.join(here, "tasks.json"), "utf8")
)

const RUNS = path.join(here, ".runs")
rmSync(RUNS, { recursive: true, force: true })
mkdirSync(RUNS, { recursive: true })
cpSync(path.resolve(source), RUNS, { recursive: true })

const conditions = readdirSync(RUNS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

// ---------------------------------------------------------------------------
// type errors
// ---------------------------------------------------------------------------

const files = conditions.flatMap((condition) =>
  tasks
    .map((task) => path.join(RUNS, condition, task.file))
    .filter((file) => existsSync(file))
)

const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  // Each attempt is its own module; two attempts at one task declare the same names.
  isolatedModules: true,
  baseUrl: PKG_ROOT,
  paths: { "@tecton/react/*": ["./src/*"] },
})

function typeErrors(file) {
  const sourceFile = program.getSourceFile(file)
  if (!sourceFile) return []
  return [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ].map((diagnostic) => {
    const { line } = diagnostic.file
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0)
      : { line: 0 }
    return `L${line + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ").slice(0, 160)}`
  })
}

// ---------------------------------------------------------------------------
// rules
// ---------------------------------------------------------------------------

const TECTON_FAMILIES = new Set(
  "azure blue graphite gray green lemon lilac lime mauve orchid pink red saffron violet yellow".split(
    " "
  )
)
const TECTON_STEPS = new Set(
  "50 100 105 110 115 120 130 140 160 190 220 260 310 370 460 560 680 830 1000 1170 1300 1440 1570".split(
    " "
  )
)
const STOCK_FAMILIES =
  "red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose slate gray zinc neutral stone"
const COLOUR_CLASS = new RegExp(
  `(?:^|[\\s:"'\`])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|decoration|placeholder|accent|caret|shadow)-((?:${STOCK_FAMILIES.replace(/ /g, "|")}|azure|graphite|lemon|lilac|mauve|orchid|saffron)-(\\d+))(?:\\/\\d+)?(?=$|[\\s"'\`])`,
  "g"
)

/** className tokens that do a variant's job on a component that owns its look. */
const STYLE_TOKEN =
  /^(?:[a-z-]+:)*(?:h-(?!full|auto|fit)|p[xytblrse]?-|size-|rounded|bg-|font-(?:thin|light|normal|medium|semibold|bold|extrabold)|text-(?:xs|sm|base|lg|xl|\d?xl|\[|muted|primary|destructive|success|warning|info|foreground|secondary|accent|card|popover)|leading-|tracking-|shadow)/

/** Components whose guideline sizes them with className (skeleton.md: `h-4 w-full`). */
const SIZED_BY_CLASS_NAME = new Set(["Skeleton"])
const RADIX_PROPS = new Set([
  "onClick",
  "checked",
  "onCheckedChange",
  "onValueChange",
  "asChild",
  "defaultChecked",
])
const DOM_CONTROLS = new Set([
  "Input",
  "Textarea",
  "NativeSelect",
  "InputGroupInput",
  "InputGroupTextarea",
])
const ICON_HOSTS = new Set([
  "Button",
  "LinkButton",
  "Badge",
  "Chip",
  "TabsTrigger",
  "Toggle",
  "InputGroupAddon",
])
const NAMED_CONTROLS = new Set([
  "Button",
  "Toggle",
  "ToggleGroupItem",
  "InputGroupButton",
  "AppShellAction",
])
const ITEM_VALUE = new Set(["SelectItem", "TabsTrigger", "TabsContent"])
const OVERLAY_OPEN = new Set([
  "Dialog",
  "AlertDialog",
  "Sheet",
  "Popover",
  "DialogTrigger",
  "AlertDialogTrigger",
  "SheetTrigger",
  "PopoverTrigger",
])

function tagName(node) {
  return node.tagName.getText()
}

function attributes(node) {
  const map = new Map()
  for (const property of node.attributes.properties) {
    if (!ts.isJsxAttribute(property)) continue
    map.set(property.name.getText(), property)
  }
  return map
}

function stringValue(attribute) {
  const init = attribute?.initializer
  if (!init) return null
  if (ts.isStringLiteral(init)) return init.text
  if (
    ts.isJsxExpression(init) &&
    init.expression &&
    ts.isStringLiteralLike(init.expression)
  ) {
    return init.expression.text
  }
  return null
}

function classText(attribute) {
  // className="…", className={cn("…", cond && "…")}, className={`…`}
  const init = attribute?.initializer
  if (!init) return ""
  const parts = []
  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) parts.push(node.text)
    else if (ts.isTemplateExpression(node)) {
      parts.push(
        node.head.text,
        ...node.templateSpans.map((span) => span.literal.text)
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(init)
  return parts.join(" ")
}

function childrenOf(element) {
  return ts.isJsxElement(element) ? element.children : []
}

function isIcon(child, iconNames) {
  const opening = ts.isJsxElement(child)
    ? child.openingElement
    : ts.isJsxSelfClosingElement(child)
      ? child
      : null
  return opening && iconNames.has(tagName(opening)) ? opening : null
}

function hasText(children) {
  return children.some(
    (child) =>
      (ts.isJsxText(child) && child.text.trim()) ||
      (ts.isJsxExpression(child) &&
        child.expression &&
        !ts.isJsxElement(child.expression)) ||
      ((ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) &&
        !/Icon$|Spinner$/.test(
          tagName(ts.isJsxElement(child) ? child.openingElement : child)
        ))
  )
}

function rulesFor(file) {
  const text = readFileSync(file, "utf8")
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const breaks = []
  const add = (rule, node, detail) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
    breaks.push({ rule, line: line + 1, detail })
  }

  // imports: which names come from where
  const tectonNames = new Set()
  const iconNames = new Set()
  const imports = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const from = statement.moduleSpecifier.text
    const names = []
    const clause = statement.importClause
    if (clause?.name) names.push(clause.name.text)
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements)
        names.push(element.name.text)
    }
    for (const name of names) imports.set(name, from)
    if (from === "@tecton/react" || /(^|\/)components\/ui(\/|$)/.test(from))
      add("root-or-ui-import", statement, from)
    if (
      from.startsWith("@tecton/react/components/") ||
      from.startsWith("@tecton/react/tecton/")
    ) {
      for (const name of names) tectonNames.add(name)
    }
    if (from === "@tecton/react/icons" || from === "lucide-react") {
      for (const name of names) iconNames.add(name)
    }
  }

  // stock colours anywhere in the file
  for (const match of text.matchAll(COLOUR_CLASS)) {
    const [family, step] = [
      match[1].split("-").slice(0, -1).join("-"),
      match[2],
    ]
    if (!TECTON_FAMILIES.has(family) || !TECTON_STEPS.has(step)) {
      const node = sourceFile.getChildAt(0)
      breaks.push({
        rule: "stock-colour",
        line: text.slice(0, match.index).split("\n").length,
        detail: match[0].trim().replace(/^["'`]/, ""),
      })
      void node
    }
  }

  const ids = new Set()
  const labelTargets = []

  const visit = (node) => {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null
    if (opening) {
      const name = tagName(opening)
      const attrs = attributes(opening)
      const id = stringValue(attrs.get("id"))
      if (id) ids.add(id)
      if (name === "FieldLabel" || name === "Label") {
        const target = stringValue(attrs.get("htmlFor"))
        if (target) labelTargets.push({ target, node: opening })
      }
      if (tectonNames.has(name)) {
        for (const prop of attrs.keys()) {
          if (RADIX_PROPS.has(prop))
            add("radix-prop", opening, `${name} ${prop}`)
        }
        if (attrs.has("disabled") && !DOM_CONTROLS.has(name))
          add("radix-prop", opening, `${name} disabled`)
        if (attrs.has("value") && ITEM_VALUE.has(name))
          add("radix-prop", opening, `${name} value`)
        if (attrs.has("open") && OVERLAY_OPEN.has(name))
          add("radix-prop", opening, `${name} open`)
        const styled = classText(attrs.get("className"))
          .split(/\s+/)
          .filter((token) => token && STYLE_TOKEN.test(token))
        if (styled.length && !SIZED_BY_CLASS_NAME.has(name))
          add("className-styling", opening, `${name}: ${styled.join(" ")}`)
      }
      if (
        ts.isJsxElement(node) &&
        ICON_HOSTS.has(name) &&
        tectonNames.has(name)
      ) {
        const children = childrenOf(node)
        const icons = children
          .map((child) => isIcon(child, iconNames))
          .filter(Boolean)
        if (icons.length && hasText(children)) {
          for (const icon of icons) {
            if (!attributes(icon).has("data-icon"))
              add("icon-without-data-icon", icon, `${tagName(icon)} in ${name}`)
          }
        }
      }
      if (NAMED_CONTROLS.has(name) && tectonNames.has(name)) {
        const children = childrenOf(node)
        const iconOnly =
          children.some((child) => isIcon(child, iconNames)) &&
          !hasText(children)
        if (
          iconOnly &&
          !attrs.has("aria-label") &&
          !attrs.has("aria-labelledby")
        ) {
          add("unnamed-icon-button", opening, name)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  for (const { target, node } of labelTargets) {
    if (!ids.has(target))
      add("label-without-target", node, `htmlFor="${target}"`)
  }

  return { breaks, imports, sourceFile }
}

// ---------------------------------------------------------------------------
// expectations
// ---------------------------------------------------------------------------

function propsOnJsx(sourceFile) {
  const found = new Map()
  const visit = (node) => {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null
    if (opening) {
      const name = tagName(opening)
      const props = found.get(name) ?? new Set()
      for (const prop of attributes(opening).keys()) props.add(prop)
      found.set(name, props)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

function expectationsFor(task, imports, sourceFile) {
  const jsx = propsOnJsx(sourceFile)
  return task.expect.map((item) => {
    if (item.import) {
      // `Sheet|SheetContent`: either name of a documented alias counts
      return {
        item,
        met: item.import
          .split("|")
          .some((name) => imports.get(name) === item.from),
      }
    }
    const elements = item.jsx.split("|")
    const props = item.prop.split("|")
    return {
      item,
      met: elements.some((name) =>
        props.some((prop) => jsx.get(name)?.has(prop))
      ),
    }
  })
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const report = {}
for (const condition of conditions) {
  report[condition] = []
  for (const task of tasks) {
    const file = path.join(RUNS, condition, task.file)
    if (!existsSync(file)) {
      report[condition].push({ task: task.id, missing: true })
      continue
    }
    const errors = typeErrors(file)
    const { breaks, imports, sourceFile } = rulesFor(file)
    const expectations = expectationsFor(task, imports, sourceFile)
    report[condition].push({
      task: task.id,
      typeErrors: errors,
      breaks,
      expectations: expectations.map(({ item, met }) => ({
        what: item.import
          ? `${item.import} from ${item.from}`
          : `<${item.jsx} ${item.prop}>`,
        met,
      })),
    })
  }
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
} else {
  const pct = (value) => `${Math.round(value * 100)}%`
  console.log(
    "condition   files  type-clean  type errors  rule breaks  expectations met"
  )
  for (const [condition, rows] of Object.entries(report)) {
    const present = rows.filter((row) => !row.missing)
    const clean = present.filter((row) => !row.typeErrors.length).length
    const errors = present.reduce((sum, row) => sum + row.typeErrors.length, 0)
    const breaks = present.reduce((sum, row) => sum + row.breaks.length, 0)
    const expectations = rows.flatMap((row) => row.expectations ?? [])
    const totalExpected = tasks.reduce(
      (sum, task) => sum + task.expect.length,
      0
    )
    const met = expectations.filter((item) => item.met).length
    console.log(
      `${condition.padEnd(11)} ${String(present.length).padStart(5)}  ${`${clean}/${present.length}`.padStart(10)}  ${String(errors).padStart(11)}  ${String(breaks).padStart(11)}  ${`${met}/${totalExpected} (${pct(met / totalExpected)})`.padStart(16)}`
    )
  }
  console.log("\nper task (type errors / rule breaks / expectations met):")
  const header = [
    "task".padEnd(20),
    ...conditions.map((condition) => condition.padEnd(14)),
  ].join("")
  console.log(header)
  for (const task of tasks) {
    const cells = conditions.map((condition) => {
      const row = report[condition].find((item) => item.task === task.id)
      if (!row || row.missing) return "missing".padEnd(14)
      const met = row.expectations.filter((item) => item.met).length
      return `${row.typeErrors.length}/${row.breaks.length}/${met}of${task.expect.length}`.padEnd(
        14
      )
    })
    console.log([task.id.padEnd(20), ...cells].join(""))
  }
}
