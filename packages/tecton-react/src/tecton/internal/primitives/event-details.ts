/**
 * Internal to `@tecton/react`: the details passed as the second argument of
 * a primitive's change callback, shaped like Base UI's
 * (`onValueChange(value, eventDetails)`). `cancel()` keeps the change from
 * being applied.
 */

type ChangeEventDetails<TReason extends string = string> = {
  /** What caused the change. */
  reason: TReason
  /** The DOM event behind it, when there is one. */
  event: Event | undefined
  /** Keeps the primitive from applying the change. */
  cancel: () => void
  readonly isCanceled: boolean
}

function createChangeEventDetails<TReason extends string>(
  reason: TReason,
  event?: Event | { nativeEvent: Event }
): ChangeEventDetails<TReason> {
  let canceled = false
  return {
    reason,
    event: event && "nativeEvent" in event ? event.nativeEvent : event,
    cancel: () => {
      canceled = true
    },
    get isCanceled() {
      return canceled
    },
  }
}

export { createChangeEventDetails }
export type { ChangeEventDetails }
