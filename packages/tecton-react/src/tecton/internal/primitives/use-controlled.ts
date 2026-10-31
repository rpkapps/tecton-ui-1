"use client"

/**
 * Internal to `@tecton/react`: the value of a prop that is either
 * controlled (`value`) or not (`defaultValue`), as Base UI's components hold
 * theirs. Uncontrolled, `setValue` stores the value; controlled, it does
 * nothing and the owner's `onValueChange` decides.
 */
import * as React from "react"

function useControlled<T>(
  controlled: T | undefined,
  defaultValue: T
): [T, (next: T) => void, boolean] {
  const isControlled = controlled !== undefined
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = isControlled ? controlled : uncontrolled
  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next)
    },
    [isControlled]
  )
  return [value, setValue, isControlled]
}

/**
 * A callback that always calls the latest `fn`, with a stable identity: for
 * handlers created once (stores, document listeners) that must read the
 * current props.
 */
function useEventCallback<TArgs extends Array<unknown>, TResult>(
  fn: ((...args: TArgs) => TResult) | undefined
): (...args: TArgs) => TResult | undefined {
  const latest = React.useRef(fn)
  React.useInsertionEffect(() => {
    latest.current = fn
  })
  return React.useCallback((...args: TArgs) => latest.current?.(...args), [])
}

export { useControlled, useEventCallback }
