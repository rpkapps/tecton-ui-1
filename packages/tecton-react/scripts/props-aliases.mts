/**
 * Props aliases — every exported component gets a `<Name>Props` type next to it
 * in its own module's declarations:
 *
 *   export type DialogContentProps = import("react").ComponentProps<typeof DialogContent>;
 *
 * so a consumer types a wrapper from the Tecton module it already imports and
 * never needs the library underneath. The aliases are appended to the emitted
 * `.d.ts` only: the generated shadcn sources stay exactly as the CLI writes them.
 */
import ts from "typescript"

const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/
const ELEMENT_RETURN = /\b(?:JSX\.Element|ReactElement|ReactNode|ReactPortal)\b/

function isComponentType(type: ts.Type, checker: ts.TypeChecker): boolean {
  // A context (`createContext`) is an exotic component too, but it has no props to alias.
  if (type.getProperty("Provider") && type.getProperty("Consumer")) return false
  // forwardRef / memo / lazy
  if (type.getProperty("$$typeof")) return true
  const signatures = type.getCallSignatures()
  if (!signatures.length) return false
  return signatures.every((signature) => {
    if (signature.getParameters().length > 2) return false
    const returned = checker.typeToString(
      checker.getReturnTypeOfSignature(signature),
      undefined,
      ts.TypeFormatFlags.UseFullyQualifiedType
    )
    return ELEMENT_RETURN.test(returned)
  })
}

function isInternal(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some((declaration) =>
    ts.getJSDocTags(declaration).some((tag) => tag.tagName.text === "internal")
  )
}

/** Every name declared or imported at the top level of `sourceFile`. */
function topLevelNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>()
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause
      if (clause?.name) names.add(clause.name.text)
      const bindings = clause?.namedBindings
      if (bindings && ts.isNamespaceImport(bindings)) names.add(bindings.name.text)
      if (bindings && ts.isNamedImports(bindings)) for (const element of bindings.elements) names.add(element.name.text)
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text)
      }
    } else if (
      (ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text)
    }
  }
  return names
}

export type PropsAliasPlan = {
  /** Component names to alias, in export order. */
  aliases: string[]
  /**
   * Module-private names an alias needs (`type CarouselProps = …` that is not
   * exported): renamed in the `.d.ts` so the public alias can take the name.
   */
  shadowed: string[]
  /** Aliases that would clash with an exported value of the same name. */
  collisions: string[]
}

/** Which exported components of `sourceFile` need a `<Name>Props` alias. */
export function propsAliasesOf(sourceFile: ts.SourceFile, checker: ts.TypeChecker): PropsAliasPlan {
  const plan: PropsAliasPlan = { aliases: [], shadowed: [], collisions: [] }
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) return plan
  const exports = checker.getExportsOfModule(moduleSymbol)
  const byName = new Map(exports.map((symbol) => [symbol.getName(), symbol]))
  const locals = topLevelNames(sourceFile)

  for (const symbol of exports) {
    const name = symbol.getName()
    if (!COMPONENT_NAME.test(name) || name.endsWith("Props")) continue
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
    if (!(target.flags & ts.SymbolFlags.Value)) continue
    // Stripped from the declarations (`stripInternal`), so there is nothing to alias.
    if (isInternal(target) || isInternal(symbol)) continue
    if (!isComponentType(checker.getTypeOfSymbolAtLocation(target, sourceFile), checker)) continue

    const aliasName = `${name}Props`
    const existing = byName.get(aliasName)
    if (existing) {
      const resolved = existing.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(existing) : existing
      if (resolved.flags & ts.SymbolFlags.Value) plan.collisions.push(aliasName)
      continue
    }
    if (locals.has(aliasName)) plan.shadowed.push(aliasName)
    plan.aliases.push(name)
  }
  return plan
}

const escape = (name: string) => name.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")

/**
 * The module's `.d.ts` with the aliases appended. A module-private name an alias
 * needs becomes `<name>_` first; an imported one keeps its import
 * (`import { type ToasterProps as ToasterProps_ } from "sonner"`).
 */
export function applyPropsAliases(dts: string, plan: Pick<PropsAliasPlan, "aliases" | "shadowed">): string {
  let out = dts
  for (const name of plan.shadowed) {
    out = out.replace(new RegExp(`\\b${escape(name)}\\b`, "g"), `${name}_`)
    out = out.replace(/import\s+(?:type\s+)?\{[^}]*\}\s*from/g, (clause) =>
      clause.replace(new RegExp(`(?<!\\bas\\s+)\\b${escape(name)}_\\b`, "g"), `${name} as ${name}_`)
    )
  }
  if (!plan.aliases.length) return out
  const declarations = plan.aliases
    .map((name) => `export type ${name}Props = import("react").ComponentProps<typeof ${name}>;`)
    .join("\n")
  return `${out.endsWith("\n") ? out : `${out}\n`}${declarations}\n`
}
