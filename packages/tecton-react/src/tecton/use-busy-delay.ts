"use client"

import * as React from "react"

type UseBusyDelayOptions = {
  /** How long `isPending` must stay `true` before the hook reports busy, in ms. */
  delay?: number
  /** How long the hook keeps reporting busy once it has, in ms. */
  minDuration?: number
}

/**
 * Tecton useBusyDelay — turns a raw pending flag into one that is safe to
 * drive a spinner or a busy state with. Work that settles within `delay` ms
 * never shows a busy state at all, and once the busy state shows it stays
 * for at least `minDuration` ms, so a fast response cannot make it flash.
 *
 * Every change of `isPending` cancels the timer scheduled for the previous
 * value before scheduling its own, and unmounting cancels it too, so a timer
 * left over from an earlier value can never change the result.
 */
function useBusyDelay(
  isPending: boolean,
  { delay = 200, minDuration = 200 }: UseBusyDelayOptions = {}
): boolean {
  const [busy, setBusy] = React.useState(false)
  // When the current busy period started; null while not busy. Kept in a ref
  // so it survives the re-renders `isPending` toggling causes.
  const shownAt = React.useRef<number | null>(null)

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (isPending) {
      if (shownAt.current === null) {
        timer = setTimeout(() => {
          shownAt.current = Date.now()
          setBusy(true)
        }, delay)
      }
      // Already busy: stay busy, and drop the pending hide (the cleanup of the
      // previous run cleared it).
    } else if (shownAt.current !== null) {
      const remaining = shownAt.current + minDuration - Date.now()
      timer = setTimeout(
        () => {
          shownAt.current = null
          setBusy(false)
        },
        Math.max(0, remaining)
      )
    }

    return () => clearTimeout(timer)
  }, [isPending, delay, minDuration])

  return busy
}

export { useBusyDelay, type UseBusyDelayOptions }
