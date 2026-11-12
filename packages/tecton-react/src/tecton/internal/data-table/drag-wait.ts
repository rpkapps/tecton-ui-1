/**
 * A press on a column header that comes before the on-demand drag and
 * drop has loaded (`lazy.ts`, the `dragAndDrop` feature; `press-wait.ts`):
 * Enter or Space starts the keyboard drag
 * once the code is there, and a pointer press starts dragging if the
 * pointer is still down. Nothing here imports drag and drop.
 */
import type * as React from "react"

import type { DragAndDrop } from "../primitives/drag-and-drop/use-drag-and-drop"
import { createPressWait, type PressWait } from "./press-wait"

/** What a waiting press needs of the drag once it has loaded. */
type WaitingDrag = Pick<
  DragAndDrop<unknown>,
  "onHandleKeyDown" | "onPointerDown"
>

function createDragWait<TDrag extends WaitingDrag>(): PressWait<TDrag> {
  return createPressWait<TDrag>((drag, element, { id, key, pointer }) => {
    if (key !== undefined)
      // What a keyboard drag reads of the key that starts it.
      drag.onHandleKeyDown(
        {
          key,
          currentTarget: element,
          preventDefault: () => undefined,
          stopPropagation: () => undefined,
        } as unknown as React.KeyboardEvent<HTMLElement>,
        id
      )
    else if (pointer) drag.onPointerDown(pointer, id)
  })
}

export { createDragWait }
