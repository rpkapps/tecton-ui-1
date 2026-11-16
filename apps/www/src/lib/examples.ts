import type * as React from "react"

import { readable } from "@/lib/preload"

/**
 * Example registry. Every file in src/examples is a demo referenced from the
 * docs by its file name (`<ComponentPreview name="button-demo" />`). Components
 * are lazy (one chunk per demo); sources are loaded on demand as raw strings.
 * Both are loaded once and shared by every component that shows them.
 */
type ExampleModule = Record<string, unknown> & {
  default?: React.ComponentType
}

const modules = import.meta.glob<ExampleModule>("../examples/*.tsx")
const sources = import.meta.glob<string>("../examples/*.tsx", {
  query: "?raw",
  import: "default",
})

function keyFor(name: string) {
  return `../examples/${name}.tsx`
}

export function hasExample(name: string) {
  return keyFor(name) in modules
}

export const exampleNames = Object.keys(modules)
  .map((key) => key.replace("../examples/", "").replace(/\.tsx$/, ""))
  .sort()

async function loadExample(name: string): Promise<React.ComponentType> {
  const load = modules[keyFor(name)]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- record lookup by user input
  if (!load) {
    throw new Error(`Unknown example: ${name}`)
  }
  const mod = await load()
  const component =
    mod.default ??
    (Object.values(mod).find((value) => typeof value === "function") as
      React.ComponentType | undefined)
  if (!component) {
    throw new Error(`Example ${name} does not export a component`)
  }
  return component
}

async function loadExampleSource(name: string): Promise<string> {
  const load = sources[keyFor(name)]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- record lookup by user input
  if (!load) {
    throw new Error(`Unknown example: ${name}`)
  }
  const source = await load()
  // Hide the provenance header of synced upstream examples in the docs.
  return source.replace(/^\/\/ Synced from shadcn\/ui[^\n]*\n/, "")
}

const components = new Map<string, Promise<React.ComponentType>>()
const exampleSources = new Map<string, Promise<string>>()

/** The example's component, loaded once, for `use()` (lib/preload.ts). */
export function getExample(name: string) {
  let promise = components.get(name)
  if (!promise) {
    promise = readable(loadExample(name))
    components.set(name, promise)
  }
  return promise
}

/** The example's source, loaded once, for `use()` (lib/preload.ts). */
export function getExampleSource(name: string) {
  let promise = exampleSources.get(name)
  if (!promise) {
    promise = readable(loadExampleSource(name))
    exampleSources.set(name, promise)
  }
  return promise
}

/** What a `<ComponentPreview name>` renders: the example and its source. */
export function preloadExample(name: string) {
  return Promise.all([getExample(name), getExampleSource(name)])
}
