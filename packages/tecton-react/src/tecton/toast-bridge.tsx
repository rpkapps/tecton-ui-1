"use client"

import * as React from "react"

/**
 * INTERNAL — not public API. Every export is tagged `@internal`, so the
 * published declarations of this module are empty; it stays in the package
 * `exports` map only because the built `toast` module imports it by package
 * name, like `@tecton/react/portal`.
 *
 * One toast stack per page. Every application on a page (the shell and each
 * micro-frontend remote) brings its own copy of the toast module, so each
 * would keep its own queue and draw its own viewport in the same corner, the
 * stacks overlapping. Instead, every `Toaster` that renders the module's own
 * `toast` queue publishes a host on `globalThis`, the page elects one of them
 * (the oldest outside any `ThemeRoot`, which is the shell's, else the oldest),
 * and the `toast` every copy exports is a proxy that routes the calls of the
 * other copies into the elected host: one queue, one viewport, one stacking
 * order, one `limit`.
 *
 * What crosses between copies is this protocol, never a React context (it
 * cannot leave its own tree) nor the primitive's manager (its subscription
 * key is private and may change between versions). The protocol is frozen:
 * a copy built today must keep working with every later one, so a change is
 * a new `protocol` number, and a copy that speaks a later protocol keeps
 * publishing a version 1 entry next to its own for the copies that only know
 * this one.
 *
 * Content that the host's React cannot render (a component of another React
 * copy) is never forwarded: that toast stays in the caller's own queue, as it
 * would without a host. Text, numbers and plain DOM elements are forwarded
 * (the element marker is a registered symbol shared by every copy of one
 * React version). With no host published (a standalone remote, an older
 * shell, the server), every call is local, exactly as before.
 */

/** @internal */
export const TOAST_HOSTS_KEY = Symbol.for("@tecton/react/toast-hosts")

type Options = { [key: string]: unknown }
/** The manager's `update` takes the changes, or a function of the toast. */
type Updates = Options | ((previous: Options) => Options)
type Outcome = string | Options | ((value: unknown) => string | Options)
type PromiseOptions = {
  loading: string | Options
  success: Outcome
  error: Outcome
}

type Manager = {
  add: (options: Options) => string
  update: (id: string, updates: Updates) => void
  close: (id?: string) => void
  promise: (promise: Promise<unknown>, options: PromiseOptions) => unknown
}

/**
 * @internal Version 1 of the cross-copy host. `globalThis[TOAST_HOSTS_KEY]`
 * is an array of hosts, in publication order.
 */
export type ToastHostV1 = {
  protocol: 1
  /** One symbol per copy of this module: a copy never forwards to itself. */
  owner: symbol
  /** Whether its `Toaster` is outside any `ThemeRoot`: the shell's. */
  root: boolean
  /** The host's `React.createElement`: same function, same React instance. */
  react: unknown
  /**
   * Whether the host can render this value (title, description, action
   * label) coming from another React instance: text, numbers and DOM
   * elements only.
   */
  accepts: (value: unknown) => boolean
  add: (options: Options) => string
  update: (id: string, updates: Updates) => void
  close: (id: string) => void
  promise: (promise: Promise<unknown>, options: PromiseOptions) => unknown
}

declare const process: { env: { NODE_ENV?: string } }

const OWNER = Symbol("@tecton/react/toast")
const ELEMENT_TYPE = (React.createElement("span") as { $$typeof?: unknown })
  .$$typeof

/**
 * The managers `bridgeToast` returned, to the manager each wraps: only their
 * `Toaster` publishes, and its host calls the wrapped manager directly, so a
 * handed-over call is never routed again.
 */
const bridged = new WeakMap<object, object>()

let nextId = 0

function isDev() {
  try {
    return process.env.NODE_ENV !== "production"
  } catch {
    return false
  }
}

function hosts(): unknown[] | undefined {
  if (typeof globalThis === "undefined") return undefined
  const list = (globalThis as Record<symbol, unknown>)[TOAST_HOSTS_KEY]
  return Array.isArray(list) ? list : undefined
}

function isHostV1(value: unknown): value is ToastHostV1 {
  if (typeof value !== "object" || value === null) return false
  const host = value as { protocol?: unknown; add?: unknown }
  return host.protocol === 1 && typeof host.add === "function"
}

/** Whether `host` is still published (its `Toaster` still mounted). */
function live(host: ToastHostV1) {
  return hosts()?.includes(host) ?? false
}

/** The page's host: the oldest outside any `ThemeRoot`, else the oldest. */
function electedHost(): ToastHostV1 | undefined {
  const known = hosts()?.filter(isHostV1) ?? []
  return known.find((host) => host.root) ?? known[0]
}

/** The elected host, unless it is this copy's own (its calls stay local). */
function foreignHost(): ToastHostV1 | undefined {
  const host = electedHost()
  return host && host.owner !== OWNER ? host : undefined
}

/**
 * Whether this React instance can render `value` built by another one. The
 * element marker is a registered symbol, the same in two copies of one React
 * version, but a component inside such an element would call the hooks of
 * its own copy: only text and DOM elements are safe.
 */
function renderable(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true
  if (Array.isArray(value)) return value.every(renderable)
  const element = value as {
    $$typeof?: unknown
    type?: unknown
    props?: { children?: unknown }
  }
  if (element.$$typeof === undefined) return true
  return (
    element.$$typeof === ELEMENT_TYPE &&
    typeof element.type === "string" &&
    renderable(element.props?.children)
  )
}

function canRender(host: ToastHostV1, value: unknown) {
  return host.react === React.createElement || host.accepts(value)
}

/** The option fields a `Toaster` renders as content, and where it reads them. */
const CONTENT_FIELDS: Record<string, (field: unknown) => unknown> = {
  title: (title) => title,
  description: (description) => description,
  actionProps: (action) =>
    (action as { children?: unknown } | undefined)?.children,
}

function contentRenderable(host: ToastHostV1, options: Options, key: string) {
  return !(key in options) || canRender(host, CONTENT_FIELDS[key](options[key]))
}

/** Whether a toast (or a promise's loading / outcome options) can be handed over. */
function accepted(host: ToastHostV1, options: unknown) {
  if (typeof options === "string" || typeof options === "function") return true
  if (typeof options !== "object" || options === null) return false
  // Anchored toasts are positioned by the caller's own anchored Toaster.
  if ((options as Options).positionerProps) return false
  return Object.keys(CONTENT_FIELDS).every((key) =>
    contentRenderable(host, options as Options, key)
  )
}

/**
 * Clears the fields a host cannot render from an update computed after the
 * toast was handed over (an updater's result, a promise outcome): the toast
 * lives in the host by then. Cleared rather than left out, so a success toast
 * never keeps its loading title.
 */
function sanitize<T>(host: ToastHostV1, options: T): T {
  if (typeof options !== "object" || options === null) return options
  const result: Options = { ...(options as Options) }
  const dropped = Object.keys(CONTENT_FIELDS).filter(
    (key) => !contentRenderable(host, result, key)
  )
  for (const key of dropped) result[key] = undefined
  if (dropped.length > 0 && isDev()) {
    console.warn(
      "Tecton: a toast shown by the page's shell was updated with content " +
        "rendered by another React copy; that content was left out. Pass text."
    )
  }
  return result as T
}

/**
 * @internal Wraps a toast manager so that, while another copy's host is
 * elected, `add`, `promise` and the `update`/`close` of the toasts handed to
 * it go to that host. Every other member (the primitive's subscription
 * included) is the manager's own, so this copy's `Toaster` keeps working.
 */
export function bridgeToast<T extends object>(local: T): T {
  const manager = local as unknown as Manager
  /** The toasts this copy handed over, by id, with the host holding each. */
  const forwarded = new Map<string, ToastHostV1>()

  function prune() {
    for (const [id, host] of forwarded) if (!live(host)) forwarded.delete(id)
  }

  /** Gives a handed-over toast an id up front and forgets it once removed. */
  function handOver(host: ToastHostV1, options: Options): Options {
    const id =
      typeof options.id === "string" && options.id
        ? options.id
        : `toast-bridge-${++nextId}-${Math.random().toString(36).slice(2)}`
    const onRemove = options.onRemove as (() => void) | undefined
    forwarded.set(id, host)
    return {
      ...options,
      id,
      onRemove() {
        if (forwarded.get(id) === host) forwarded.delete(id)
        onRemove?.()
      },
    }
  }

  function outcome(host: ToastHostV1, option: Outcome): Outcome {
    return typeof option === "function"
      ? (value: unknown) => sanitize(host, option(value))
      : option
  }

  const routed: Manager = {
    add(options) {
      const host = foreignHost()
      if (!host || !accepted(host, options)) return manager.add(options)
      prune()
      return host.add(handOver(host, options))
    },
    update(id, updates) {
      const host = forwarded.get(id)
      if (!host) return manager.update(id, updates)
      // The host's Toaster unmounted, and the toast with it.
      if (!live(host)) {
        forwarded.delete(id)
        return
      }
      host.update(
        id,
        typeof updates === "function"
          ? (previous) => sanitize(host, updates(previous))
          : sanitize(host, updates)
      )
    },
    close(id) {
      if (id === undefined) {
        for (const [forwardedId, host] of forwarded) {
          if (live(host)) host.close(forwardedId)
        }
        forwarded.clear()
        return manager.close()
      }
      const host = forwarded.get(id)
      if (!host) return manager.close(id)
      forwarded.delete(id)
      if (live(host)) host.close(id)
    },
    promise(promise, options) {
      const host = foreignHost()
      if (
        !host ||
        typeof options !== "object" ||
        !accepted(host, options.loading) ||
        !accepted(host, options.success) ||
        !accepted(host, options.error)
      ) {
        return manager.promise(promise, options)
      }
      prune()
      const loading =
        typeof options.loading === "string"
          ? { description: options.loading }
          : options.loading
      return host.promise(promise, {
        ...options,
        loading: handOver(host, loading),
        success: outcome(host, options.success),
        error: outcome(host, options.error),
      })
    },
  }

  const proxy = new Proxy(local, {
    get(target, key, receiver) {
      if (typeof key === "string" && Object.hasOwn(routed, key)) {
        return routed[key as keyof Manager]
      }
      return Reflect.get(target, key, receiver)
    },
  })
  bridged.set(proxy, local)
  return proxy
}

/**
 * Set by `ThemeRoot`: a `Toaster` under it belongs to a remote (or an
 * inverted section), so its host is elected only when no `Toaster` outside
 * a `ThemeRoot` (the shell's) is published.
 */
const InsideThemeRootContext = React.createContext(false)

/** @internal Marks a `ThemeRoot` subtree. */
export function ToastHostBoundary({ children }: { children: React.ReactNode }) {
  return (
    <InsideThemeRootContext value={true}>{children}</InsideThemeRootContext>
  )
}

/**
 * @internal Publishes `manager` as a toast host while the calling `Toaster`
 * is mounted, when it renders the module's own `toast` queue (a `Toaster`
 * given a manager of its own keeps it to itself).
 */
export function useToastHost(manager: object) {
  const insideThemeRoot = React.useContext(InsideThemeRootContext)
  React.useEffect(() => {
    const local = bridged.get(manager)
    if (!local || typeof globalThis === "undefined") return
    const target = local as Manager
    const host: ToastHostV1 = {
      protocol: 1,
      owner: OWNER,
      root: !insideThemeRoot,
      react: React.createElement,
      accepts: renderable,
      add: (options) => target.add(options),
      update: (id, updates) => target.update(id, updates),
      close: (id) => target.close(id),
      promise: (promise, options) => target.promise(promise, options),
    }
    const store = globalThis as Record<symbol, unknown>
    const list = hosts() ?? (store[TOAST_HOSTS_KEY] = [] as unknown[])
    list.push(host)
    return () => {
      const index = list.indexOf(host)
      if (index !== -1) list.splice(index, 1)
    }
  }, [manager, insideThemeRoot])
}
