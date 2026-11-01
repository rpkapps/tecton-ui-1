/**
 * Internal to `@tecton/react`: a drag from the keyboard, usually started
 * with Enter or Space on a drag handle. The places a drop can go are
 * stepped through with the arrow keys along `axis` (or Tab / Shift+Tab),
 * Enter or Space drops, and Escape, or a press elsewhere, cancels. The
 * caller shows and names the aimed place (a focused drop target).
 *
 * Listeners sit on the window in the capture phase, ahead of the
 * component's own key handling, which must not see the keys a drag uses.
 */

type KeyboardDragOptions<TPlace> = {
  view: Window
  /** The arrow keys that step: Up / Down for "y", Left / Right for "x". */
  axis?: "x" | "y"
  /** Reading direction, for `axis="x"`. */
  direction?: "ltr" | "rtl"
  /**
   * Every place a drop can go, in order, and the index to aim at first.
   * Read on every key, since the places change with the collection.
   */
  places: () => { places: ReadonlyArray<TPlace>; start: number }
  /** Whether two places are the same one. */
  isSame: (a: TPlace, b: TPlace) => boolean
  /**
   * Whether two places are the same stop of the arrow keys: a place aimed
   * otherwise (`onKey`) may be drawn elsewhere than the stop it stands for.
   * `isSame` by default.
   */
  isStop?: (a: TPlace, b: TPlace) => boolean
  /** Shows the aimed place (null for none). */
  onAim: (place: TPlace | null) => void
  /**
   * Other keys during the drag (opening the aimed folder…): `true` when
   * handled, which keeps them from the component.
   */
  onKey?: (event: KeyboardEvent, place: TPlace | null) => boolean
  /** Called once: with the aimed place on a drop, null on a cancel. */
  onEnd: (place: TPlace | null) => void
  /** Elements whose presses do not cancel (the drop targets themselves). */
  isInside?: (target: EventTarget | null) => boolean
}

/** Starts a keyboard drag; returns a function that ends it without `onEnd`. */
function startKeyboardDrag<TPlace>({
  view,
  axis = "y",
  direction = "ltr",
  places,
  isSame,
  isStop = isSame,
  onAim,
  onKey,
  onEnd,
  isInside,
}: KeyboardDragOptions<TPlace>) {
  let aimed: TPlace | null = null

  /** Aims `step` places on from the current one. */
  const aim = (step: number) => {
    const { places: list, start } = places()
    const index = aimed === null ? -1 : list.findIndex((p) => isStop(p, aimed!))
    const last = list.length - 1
    aimed =
      list.at(
        index < 0
          ? Math.min(start, last)
          : Math.max(0, Math.min(last, index + step))
      ) ?? null
    onAim(aimed)
  }

  const next =
    axis === "y"
      ? "ArrowDown"
      : direction === "rtl"
        ? "ArrowLeft"
        : "ArrowRight"
  const previous =
    axis === "y" ? "ArrowUp" : direction === "rtl" ? "ArrowRight" : "ArrowLeft"

  const end = (drop: boolean) => {
    const place = drop ? aimed : null
    stop()
    onEnd(place)
  }

  const keydown = (event: KeyboardEvent) => {
    if (event.key === next || (event.key === "Tab" && !event.shiftKey)) aim(1)
    else if (event.key === previous || (event.key === "Tab" && event.shiftKey))
      aim(-1)
    else if (event.key === "Enter" || event.key === " ") end(true)
    else if (event.key === "Escape") end(false)
    else if (!onKey?.(event, aimed)) return
    event.preventDefault()
    event.stopPropagation()
  }
  const pointerdown = (event: PointerEvent) => {
    if (!isInside?.(event.target)) end(false)
  }
  view.addEventListener("keydown", keydown, true)
  view.addEventListener("pointerdown", pointerdown, true)

  function stop() {
    view.removeEventListener("keydown", keydown, true)
    view.removeEventListener("pointerdown", pointerdown, true)
  }

  aim(0)
  return {
    stop,
    aim: (place: TPlace | null) => {
      aimed = place
      onAim(place)
    },
    current: () => aimed,
  }
}

export { startKeyboardDrag }
export type { KeyboardDragOptions }
