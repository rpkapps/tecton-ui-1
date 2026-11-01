"use client"

/**
 * Internal to `@tecton/react`: drag and drop for a collection that decides
 * where a drop goes itself (a tree, a list with folders). The collection
 * supplies a drop strategy — the place under the pointer, the places in
 * keyboard order, how to name one — and what a drag carries; this runs the
 * three ways of dragging, holds the state the items and the drop indicator
 * read, and speaks the announcements.
 *
 * - Pointer: from an item (a mouse or a pen at once, a finger after a long
 *   press) or its handle (a finger at once), through `trackPointerDrag`.
 * - Keyboard: Enter or Space on a handle; the arrow keys step through the
 *   places, each one a focused drop target named after it (`DropIndicator`).
 * - Screen reader on a touch screen ("virtual" click on the handle): every
 *   place becomes a button to swipe to and double tap.
 *
 * For one row or column reordered with the items sliding aside, use
 * `useSortable` (`./sortable`) instead.
 */
import * as React from "react"

import { createStore, type Store } from "../../store"
import { announce } from "../live-announcer"
import { useTranslations, type Translator } from "../../i18n/translations"
import { startKeyboardDrag } from "./keyboard-drag"
import { trackPointerDrag, type Point } from "./pointer-drag"

type DragMode = "pointer" | "keyboard" | "virtual"

type DragState<TPlace> = {
  mode: DragMode | null
  /** The keys being dragged, in collection order. */
  dragging: ReadonlyArray<string>
  /** Where a drop would go now. */
  aimed: TPlace | null
  /** Every allowed place, for the virtual drop targets. */
  places: ReadonlyArray<TPlace>
}

type DropStrategy<TPlace> = {
  /** The allowed place under the pointer, if any. */
  placeAt: (point: Point, dragging: ReadonlyArray<string>) => TPlace | null
  /** Every allowed place in keyboard order, and the one to aim at first. */
  places: (dragging: ReadonlyArray<string>) => {
    places: ReadonlyArray<TPlace>
    start: number
  }
  isSame: (a: TPlace, b: TPlace) => boolean
  /** The place in words, as a drop target's name ("Drop on Wells"). */
  label: (place: TPlace, t: Translator<"dragAndDrop">) => string
  /** Called as the aim changes (opening a folder held over, scrolling). */
  onAim?: (place: TPlace | null, mode: DragMode) => void
  /** Other keys during a keyboard drag; `true` when handled. */
  onKey?: (event: KeyboardEvent, place: TPlace | null) => boolean
}

type DragAndDropOptions<TPlace> = {
  strategy: DropStrategy<TPlace>
  /** What a drag from `key` carries: the selection, when `key` is in it. */
  getDragged: (key: string) => Array<string>
  /** The element of an item, for the pointer preview and focus. */
  getItemElement: (key: string) => HTMLElement | null
  /** The collection element: it takes the pointer and scrolls. */
  getContainer: () => HTMLElement | null
  /**
   * The arrow keys that step through the places in a keyboard drag: Up /
   * Down for "y" (default), Left / Right for "x", mirrored when `direction`
   * is "rtl". Tab / Shift+Tab step either way.
   */
  axis?: "x" | "y"
  direction?: "ltr" | "rtl"
  /** Where the pointer preview goes (the portal target); the body otherwise. */
  getPreviewContainer?: () => HTMLElement | null
  onDragStart?: (keys: ReadonlyArray<string>, mode: DragMode) => void
  /**
   * Drops `keys` on `place`. `from`: where the pointer preview was let go,
   * for the dropped item to animate from there into its place.
   */
  onDrop: (
    place: TPlace,
    keys: ReadonlyArray<string>,
    details: { mode: DragMode; from: DOMRect | null }
  ) => void
  /**
   * Focuses an item after a keyboard or virtual drag (the first dropped
   * one); its element's `focus()` by default.
   */
  focusItem?: (key: string) => void
}

type DragAndDrop<TPlace> = {
  store: Store<DragState<TPlace>>
  t: Translator<"dragAndDrop">
  isSame: (a: TPlace, b: TPlace) => boolean
  label: (place: TPlace) => string
  /** A press on an item (`handle`: on its drag handle). */
  onPointerDown: (
    event: React.PointerEvent<HTMLElement>,
    key: string,
    options?: { handle?: boolean }
  ) => void
  /** Enter or Space on a drag handle starts a keyboard drag. */
  onHandleKeyDown: (
    event: React.KeyboardEvent<HTMLElement>,
    key: string
  ) => void
  /** A screen reader's click on a drag handle starts a virtual drag. */
  onHandleClick: (event: React.MouseEvent<HTMLElement>, key: string) => void
  /** Drops on `place` (a virtual drop target was pressed). */
  drop: (place: TPlace) => void
  cancel: () => void
  /** Whether `target` is one of the drop targets (presses there do not cancel). */
  registerTargets: (element: HTMLElement | null) => void
}

const LONG_PRESS_POINTERS = new Set(["touch"])

function useDragAndDrop<TPlace>(
  options: DragAndDropOptions<TPlace>
): DragAndDrop<TPlace> {
  const t = useTranslations("dragAndDrop")
  const latest = React.useRef({ options, t })
  React.useInsertionEffect(() => {
    latest.current = { options, t }
  })

  const [api] = React.useState(() => {
    const store = createStore<DragState<TPlace>>({
      mode: null,
      dragging: [],
      aimed: null,
      places: [],
    })
    let stopSession: (() => void) | null = null
    let origin: HTMLElement | null = null
    let targets: HTMLElement | null = null

    const strategy = () => latest.current.options.strategy
    const aim = (place: TPlace | null) => {
      const { aimed, mode } = store.get()
      if (
        place === aimed ||
        (place && aimed && strategy().isSame(place, aimed))
      )
        return
      store.set({ aimed: place })
      if (mode) strategy().onAim?.(place, mode)
    }

    const begin = (key: string, mode: DragMode) => {
      const keys = latest.current.options.getDragged(key)
      store.set({ mode, dragging: keys, aimed: null, places: [] })
      latest.current.options.onDragStart?.(keys, mode)
      return keys
    }

    const finish = (place: TPlace | null, from: DOMRect | null = null) => {
      const { dragging, mode } = store.get()
      stopSession = null
      store.set({ mode: null, dragging: [], aimed: null, places: [] })
      strategy().onAim?.(null, mode ?? "pointer")
      const { options, t } = latest.current
      if (place !== null)
        options.onDrop(place, dragging, { mode: mode ?? "pointer", from })
      if (mode !== "pointer")
        announce(t(place === null ? "dropCanceled" : "dropComplete"), {
          politeness: "assertive",
        })
      const back = origin
      origin = null
      if (mode === "pointer") return
      // After the drop has rendered: a cancel goes back to the handle, a
      // drop to the first dropped item.
      queueMicrotask(() => {
        if (place === null && back?.isConnected) return back.focus()
        const first = dragging.at(0)
        if (first === undefined) return
        if (options.focusItem) options.focusItem(first)
        else options.getItemElement(first)?.focus()
      })
    }

    const api: DragAndDrop<TPlace> = {
      store,
      // The current locale's translator, read when called.
      t: ((...args: Parameters<Translator<"dragAndDrop">>) =>
        latest.current.t(...args)) as Translator<"dragAndDrop">,
      isSame: (a, b) => strategy().isSame(a, b),
      label: (place) => strategy().label(place, latest.current.t),
      onPointerDown(event, key, { handle = false } = {}) {
        if (stopSession || event.button !== 0 || event.defaultPrevented) return
        const { options } = latest.current
        const item = options.getItemElement(key)
        const container = options.getContainer()
        if (!item || !container) return
        const touch = LONG_PRESS_POINTERS.has(event.pointerType)
        stopSession = trackPointerDrag(event, {
          longPress: touch && !handle,
          capture: container,
          // From the item: the collection's scroll container may sit inside
          // the collection element (a table's container inside Reorderable).
          autoScroll: item,
          preview: { item, container: options.getPreviewContainer?.() },
          onStart: () => {
            begin(key, "pointer")
          },
          onMove: (point) =>
            aim(strategy().placeAt(point, store.get().dragging)),
          onEnd: (drop, from) => finish(drop ? store.get().aimed : null, from),
          onStop: () => {
            if (store.get().mode === null) stopSession = null
          },
        })
      },
      onHandleKeyDown(event, key) {
        if (stopSession || (event.key !== "Enter" && event.key !== " ")) return
        event.preventDefault()
        event.stopPropagation()
        origin = event.currentTarget
        begin(key, "keyboard")
        announce(latest.current.t("dragStartedKeyboard"), {
          politeness: "assertive",
        })
        const view = event.currentTarget.ownerDocument.defaultView ?? window
        const { axis, direction } = latest.current.options
        const session = startKeyboardDrag<TPlace>({
          view,
          axis,
          direction,
          places: () => strategy().places(store.get().dragging),
          isSame: (a, b) => strategy().isSame(a, b),
          onAim: aim,
          onKey: (keyEvent, place) =>
            strategy().onKey?.(keyEvent, place) ?? false,
          onEnd: finish,
          isInside: (target) =>
            !!targets && target instanceof Node && targets.contains(target),
        })
        stopSession = session.stop
      },
      onHandleClick(event, key) {
        // A screen reader's activation: no pointer, no detail.
        if (stopSession || event.detail !== 0) return
        event.preventDefault()
        origin = event.currentTarget
        begin(key, "virtual")
        const { places } = strategy().places(store.get().dragging)
        store.set({ places })
        announce(latest.current.t("dragStartedVirtual"), {
          politeness: "assertive",
        })
        const view = event.currentTarget.ownerDocument.defaultView ?? window
        const onKey = (keyEvent: KeyboardEvent) => {
          if (keyEvent.key !== "Escape") return
          keyEvent.preventDefault()
          keyEvent.stopPropagation()
          end(null)
        }
        const onPress = (pressEvent: PointerEvent) => {
          if (!(
            targets &&
            pressEvent.target instanceof Node &&
            targets.contains(pressEvent.target)
          ))
            end(null)
        }
        const end = (place: TPlace | null) => {
          view.removeEventListener("keydown", onKey, true)
          view.removeEventListener("pointerdown", onPress, true)
          finish(place)
        }
        view.addEventListener("keydown", onKey, true)
        view.addEventListener("pointerdown", onPress, true)
        stopSession = () => {
          view.removeEventListener("keydown", onKey, true)
          view.removeEventListener("pointerdown", onPress, true)
        }
        virtualEnd = end
      },
      drop(place) {
        if (store.get().mode === "virtual") virtualEnd?.(place)
      },
      cancel() {
        if (store.get().mode === null) return
        stopSession?.()
        finish(null)
      },
      registerTargets(element) {
        targets = element
      },
    }
    let virtualEnd: ((place: TPlace | null) => void) | null = null
    return api
  })

  React.useEffect(() => () => api.cancel(), [api])
  return api
}

export { useDragAndDrop }
export type {
  DragAndDrop,
  DragAndDropOptions,
  DragMode,
  DragState,
  DropStrategy,
}
