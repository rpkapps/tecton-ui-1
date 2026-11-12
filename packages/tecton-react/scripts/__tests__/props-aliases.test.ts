import ts from "typescript"
import { describe, expect, it } from "vitest"

import { applyPropsAliases, propsAliasesOf } from "../props-aliases.mjs"

/** Type-checks `source` as `/mod.tsx` against a minimal, self-contained React. */
function plan(source: string) {
  const react = `
    declare namespace React {
      namespace JSX { interface Element {} }
      type ReactNode = JSX.Element | string | null
      interface ExoticComponent<P> { (props: P): ReactNode; readonly $$typeof: symbol }
      interface Context<T> extends ExoticComponent<{ value: T }> { Provider: unknown; Consumer: unknown }
    }
  `
  const files: Record<string, string> = {
    "/react.d.ts": react,
    "/mod.tsx": source,
  }
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    noLib: true,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name, version) =>
    name in files
      ? ts.createSourceFile(name, files[name], version, true)
      : undefined
  host.fileExists = (name) => name in files
  host.readFile = (name) => files[name]
  const program = ts.createProgram({
    rootNames: Object.keys(files),
    options,
    host,
  })
  return propsAliasesOf(
    program.getSourceFile("/mod.tsx")!,
    program.getTypeChecker()
  )
}

describe("propsAliasesOf", () => {
  it("aliases every exported function component, in export order", () => {
    expect(
      plan(`
        function Dialog(props: { open?: boolean }): React.JSX.Element { return null! }
        function DialogContent(props: { className?: string }): React.JSX.Element { return null! }
        export { DialogContent, Dialog }
      `)
    ).toEqual({
      aliases: ["DialogContent", "Dialog"],
      shadowed: [],
      collisions: [],
    })
  })

  it("aliases exotic components (forwardRef, memo) but not contexts", () => {
    expect(
      plan(`
        export declare const Button: React.ExoticComponent<{ size?: "sm" }>
        export declare const SidebarContext: React.Context<number>
      `).aliases
    ).toEqual(["Button"])
  })

  it("skips hooks, variants, constants and types", () => {
    expect(
      plan(`
        export function useSidebar() { return 1 }
        export const buttonVariants = (o: { size?: string }) => ""
        export const MAX_ITEMS = 3
        export type Tone = "info"
        export interface Thing { a: 1 }
        export function Helper(a: string, b: string, c: string): React.JSX.Element { return null! }
        export function Format(value: number): string { return "" }
      `).aliases
    ).toEqual([])
  })

  it("keeps an existing <Name>Props type and reports a <Name>Props value", () => {
    expect(
      plan(`
        export type ChipProps = { label: string }
        export function Chip(props: ChipProps): React.JSX.Element { return null! }
        export function Tag(props: {}): React.JSX.Element { return null! }
        export const TagProps = {}
      `)
    ).toEqual({ aliases: [], shadowed: [], collisions: ["TagProps"] })
  })

  it("skips @internal components, which the declarations strip", () => {
    expect(
      plan(`
        /** @internal */
        export function PortalProvider(props: {}): React.JSX.Element { return null! }
      `).aliases
    ).toEqual([])
  })

  it("marks a module-private <Name>Props for renaming", () => {
    expect(
      plan(`
        type CarouselProps = { loop?: boolean }
        export function Carousel(props: CarouselProps & { id?: string }): React.JSX.Element { return null! }
      `)
    ).toEqual({
      aliases: ["Carousel"],
      shadowed: ["CarouselProps"],
      collisions: [],
    })
  })
})

describe("applyPropsAliases", () => {
  it("appends one ComponentProps alias per component", () => {
    expect(
      applyPropsAliases("export { Dialog, DialogContent };", {
        aliases: ["Dialog", "DialogContent"],
        shadowed: [],
      })
    ).toBe(
      "export { Dialog, DialogContent };\n" +
        'export type DialogProps = import("react").ComponentProps<typeof Dialog>;\n' +
        'export type DialogContentProps = import("react").ComponentProps<typeof DialogContent>;\n'
    )
  })

  it("leaves a module without components untouched", () => {
    expect(
      applyPropsAliases("export {};\n", { aliases: [], shadowed: [] })
    ).toBe("export {};\n")
  })

  it("renames a module-private <Name>Props, keeping an import's source name", () => {
    const dts = [
      'import { type ToasterProps } from "sonner";',
      "type CarouselProps = { loop?: boolean };",
      "declare function Carousel(p: CarouselProps): React.JSX.Element;",
      "declare const Toaster: ({ ...props }: ToasterProps) => React.JSX.Element;",
      "export { Carousel, Toaster };",
    ].join("\n")
    expect(
      applyPropsAliases(dts, {
        aliases: ["Carousel", "Toaster"],
        shadowed: ["CarouselProps", "ToasterProps"],
      })
    ).toBe(
      [
        'import { type ToasterProps as ToasterProps_ } from "sonner";',
        "type CarouselProps_ = { loop?: boolean };",
        "declare function Carousel(p: CarouselProps_): React.JSX.Element;",
        "declare const Toaster: ({ ...props }: ToasterProps_) => React.JSX.Element;",
        "export { Carousel, Toaster };",
        'export type CarouselProps = import("react").ComponentProps<typeof Carousel>;',
        'export type ToasterProps = import("react").ComponentProps<typeof Toaster>;',
        "",
      ].join("\n")
    )
  })
})
